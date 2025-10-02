import { Stack, StackProps } from "aws-cdk-lib";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { IdentityPool, UserPoolAuthenticationProvider } from "aws-cdk-lib/aws-cognito-identitypool";
import { Construct } from "constructs";

export class CognitoStack extends Stack {

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Create User Pool
        const userPool = new UserPool(this, 'UserPoolTodoWebApp', {
            userPoolName: 'UserPoolTodoWebApp',
            selfSignUpEnabled: true, // Allow users to sign up
            autoVerify: { email: true }, // Verify email addresses by sending a verification code
            signInAliases: { email: true }, // Set email as an alias
        });

        //Create User Pool Client
        const userPoolClient = new UserPoolClient(
            this,
            'UserPoolClientTodoWebApp',
            {
                userPool,
                generateSecret: false, // Don't need to generate secret for web app running on browsers
            }
        );

        // Create an Identity Pool
        const identityPool = new IdentityPool(this, 'IdentityPoolTodoWebApp', {
            allowUnauthenticatedIdentities: true,
            authenticationProviders: {
                userPools: [
                    new UserPoolAuthenticationProvider({
                        userPool: userPool,
                        userPoolClient: userPoolClient,
                    })
                ],
            }
        })
    }
}