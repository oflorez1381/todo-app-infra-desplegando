#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AmplifyHostingStack } from '../lib/amplify-stack';
import { CognitoStack } from '../lib/cognito-stack';

const app = new cdk.App();
const cognitoStack = new CognitoStack(app, 'TodoAppCognitoStack', {});

const amplifyStack = new AmplifyHostingStack(app, 'TodoAppAmplifyHostingStack', {
    userPoolId: cognitoStack.userPoolId.value,
    userPoolClientId: cognitoStack.userPoolClientId.value,
    identityPoolId: cognitoStack.identityPoolId.value,
});