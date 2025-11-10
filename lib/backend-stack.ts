import { CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import path = require("path");
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, GlobalSecondaryIndexProps, Table } from "aws-cdk-lib/aws-dynamodb";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";


import { UserPool } from "aws-cdk-lib/aws-cognito";

interface BackendStackProps extends StackProps {
    readonly userPoolArn: string
}

export class BackendStack extends Stack {
    public readonly apiUrl: CfnOutput;
    public readonly lambdaFunctionName: CfnOutput;

    constructor(scope: Construct, id: string, props: BackendStackProps) {
        super(scope, id, props);

        /* Item schema:
            todo: {
                userId: string,
                createdAt: string,
                todoId: string,
                title: string,
                completed: boolean
            }
        */
        const todoTable = new Table(this, `TodoWebAppTableDynamoDB`, {
            partitionKey: {
                name: 'userId',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'createdAt',
                type: AttributeType.STRING,
            },
            billingMode: BillingMode.PAY_PER_REQUEST,
        });

        const gsi1: GlobalSecondaryIndexProps = {
            indexName: 'todoId-index',
            partitionKey: {
                name: 'todoId',
                type: AttributeType.STRING,
            },
        };

        todoTable.addGlobalSecondaryIndex(gsi1);

        // Backend function
        const backendFunction = new NodejsFunction(this, 'TodoWebAppBackendFunction', {
            entry: path.join(__dirname, '../lambda/index.ts'),
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_22_X,

            // Bundle configuration
            bundling: {
                minify: true,
                sourceMap: true,
                externalModules: [
                    'aws-sdk',
                ],
            },

            environment: {
                TABLE_NAME: todoTable.tableName,
                INDEX_NAME: gsi1.indexName
            }
        });

        // Give permissions to the function to access the dynamodb table
        backendFunction.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                'dynamodb:PutItem',
                'dynamodb:Query',
                'dynamodb:DeleteItem',
                'dynamodb:UpdateItem'
            ],
            resources: [
                todoTable.tableArn,
                `${todoTable.tableArn}/index/*`
            ]
        }));

        // Create API Gateway
        const backendApi = new apigateway.RestApi(this, 'TodoWebAppAPIGateway', {
            restApiName: 'TodoWebAppBackendAPI',
            description: 'API Gateway for the TODO WebApp Backend',
            defaultCorsPreflightOptions: {
                allowOrigins: ['*'], // You should restrict this to specific domains in production
                allowMethods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
                allowHeaders: [
                    'Content-Type',
                    'Authorization',
                    'X-Amz-Date',
                    'X-Api-Key',
                    'X-Amz-Security-Token'
                ],
                allowCredentials: true, // Set to true if you need to support credentials
                maxAge: Duration.days(1) // Cache preflight results for 1 day (optional)
            }
        });

       const userPool = UserPool.fromUserPoolArn(this, 'ImportedUserPool', props.userPoolArn)

        //Create authorizers
        const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'TodoWebAppAuthorizer', {
            cognitoUserPools: [userPool]
        });

        // Create method options with authorization
        const methodOptions: apigateway.MethodOptions = {
            authorizationType: apigateway.AuthorizationType.COGNITO,
            authorizer: authorizer
        };


        // Create an API Gateway resource and method
        const integration = new apigateway.LambdaIntegration(backendFunction);

        //Add resources and methods
        const todos = backendApi.root.addResource('todos');
        todos.addMethod('GET', integration, methodOptions);
        todos.addMethod('POST', integration, methodOptions);

        // Add /todos/{id} resource
        const todoWithId = todos.addResource('{id}');
        todoWithId.addMethod('DELETE', integration, { // DELETE /todos/{id}
            ...methodOptions,
            requestParameters: {
                'method.request.path.id': true  // Makes the id parameter required
            }
        });
        todoWithId.addMethod('PATCH', integration, { // PATCH /todos/{id}
            ...methodOptions,
            requestParameters: {
                'method.request.path.id': true  // Makes the id parameter required
            }
        });

        // Output the API Gateway URL
        this.apiUrl = new CfnOutput(this, 'TodoWebAppAPI', {
            value: backendApi.url,
            description: 'API Gateway URL'
        });

        this.lambdaFunctionName = new CfnOutput(this, 'TodoWebAppBackendFunctionName', {
            value: backendFunction.functionName,
            description: 'Backend Lambda Function Name'
        });
        
    }
}