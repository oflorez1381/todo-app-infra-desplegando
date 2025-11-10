#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AmplifyHostingStack } from '../lib/amplify-stack';
import { CognitoStack } from '../lib/cognito-stack';
import { BackendStack } from '../lib/backend-stack';
import { CloudWatchStack } from '../lib/cloudwatch-stack.ts';

const app = new cdk.App();
const cognitoStack = new CognitoStack(app, 'TodoAppCognitoStack', {});

const backendStack = new BackendStack(app, 'TodoAppBackendStack', {
    userPoolArn: cognitoStack.userPoolArn.value
});

const amplifyStack = new AmplifyHostingStack(app, 'TodoAppAmplifyHostingStack', {
    userPoolId: cognitoStack.userPoolId.value,
    userPoolClientId: cognitoStack.userPoolClientId.value,
    identityPoolId: cognitoStack.identityPoolId.value,
    serverURL: backendStack.apiUrl.value
});

const cloudWatchStack = new CloudWatchStack(app, 'TodoAppCloudWatchStack', {
    amplifyAppId: amplifyStack.amplifyAppId.value,
    functionName: backendStack.lambdaFunctionName.value
});