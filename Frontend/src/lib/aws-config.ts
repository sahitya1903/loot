// AWS Amplify configuration for Face Liveness
// Using Cognito Identity Pool for unauthenticated access to Rekognition Face Liveness

const awsConfig = {
    Auth: {
        // Cognito Identity Pool ID - allows unauthenticated access to Rekognition
        identityPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID || '',
        // Region must match your Identity Pool region
        region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1',
        mandatorySignIn: false,
    },
};

export default awsConfig;
