#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AmplifyHostingStack } from '../lib/amplify-stack';
import { CognitoStack } from '../lib/cognito-stack';
import { BackendStack } from '../lib/backend-stack';

const app = new cdk.App();
const cognitoStack = new CognitoStack(app, 'TodoAppCognitoStack', {});

const backendStack = new BackendStack(app, 'TodoAppBackendStack', {});

const amplifyStack = new AmplifyHostingStack(app, 'TodoAppAmplifyHostingStack', {
    userPoolId: cognitoStack.userPoolId.value,
    userPoolClientId: cognitoStack.userPoolClientId.value,
    identityPoolId: cognitoStack.identityPoolId.value,
    serverURL: backendStack.apiUrl.value
});