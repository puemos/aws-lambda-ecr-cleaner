const configBuilder = (config, context) => {
    const DRY_RUN = true;
    const AWS_ACCOUNT_ID = context.invoked_function_arn.split(":")[4];
    const REGION = "us-east-1";
    const REPO_AGE_THRESHOLD = 90;
    const REPO_FIRST_N_THRESHOLD = 3;
    const API_DELAY = 500;
    const defaultConfig = {
        DRY_RUN,
        AWS_ACCOUNT_ID,
        REGION,
        REPO_AGE_THRESHOLD,
        REPO_FIRST_N_THRESHOLD,
        API_DELAY
    };
    const nextConfig = Object.assign({}, defaultConfig, config, process.env);

    if (!nextConfig.REPO_TO_CLEAN) {
        console.error("ERROR: NO REPO_TO_CLEAN, must be set");
        return context.fail(new Error("Must set REPO_TO_CLEAN"));
    }

    return nextConfig;
};

module.exports = configBuilder;
