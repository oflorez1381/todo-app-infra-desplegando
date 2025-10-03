import { CfnOutput, SecretValue, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
    App,
    GitHubSourceCodeProvider,
    RedirectStatus,
} from '@aws-cdk/aws-amplify-alpha';

interface AmplifyStackProps extends StackProps {
    readonly userPoolId: string;
    readonly userPoolClientId: string;
    readonly identityPoolId: string;
    readonly serverURL: string;
}

export class AmplifyHostingStack extends Stack {

    constructor(scope: Construct, id: string, props: AmplifyStackProps) {
        super(scope, id, props);

        // Create the Amplify application
        const amplifyApp = new App(this, `TodoWebApp`, {
            sourceCodeProvider: new GitHubSourceCodeProvider({
                owner: 'oflorez1381',
                repository: 'todo-app-desplegando',
                oauthToken: SecretValue.secretsManager('github'),
            }),
            environmentVariables: {
                REGION: this.region,
                IS_MOCK: 'false',
                USER_POOL_ID: props.userPoolId,
                USER_POOL_CLIENT_ID: props.userPoolClientId,
                IDENTITY_POOL_ID: props.identityPoolId,
                SERVER_URL: props.serverURL,
            },
        });

        // Add a branch
        const main = amplifyApp.addBranch('main', {
            autoBuild: true,
            stage: 'PRODUCTION'
        });

        amplifyApp.addCustomRule({
            source:
                '</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>',
            target: '/index.html',
            status: RedirectStatus.REWRITE,
        });

        new CfnOutput(this, 'AmplifyAppName', {
            value: amplifyApp.appName,
        });

        new CfnOutput(this, 'AmplifyURL', {
            value: `https://main.${amplifyApp.defaultDomain}`,
        });

    }

}