import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import path = require("path");
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class BackendStack extends Stack {
    public readonly apiUrl: CfnOutput;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

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
                //Add environment variables if needed
            }
        });

        // Create API Gateway
        const backendApi = new apigateway.RestApi(this, 'TodoWebAppAPIGateway', {
            restApiName: 'TodoWebAppBackendAPI',
            description: 'API Gateway for the TODO WebApp Backend',
        });

         // Create an API Gateway resource and method
         const integration = new apigateway.LambdaIntegration(backendFunction);

         //Add resources and methods
        const todos = backendApi.root.addResource('todos');
        todos.addMethod('GET', integration);
        todos.addMethod('POST', integration);
    
        // Output the API Gateway URL
        this.apiUrl = new CfnOutput(this, 'TodoWebAppAPI', {
            value: backendApi.url,
            description: 'API Gateway URL'
        });
    }
}