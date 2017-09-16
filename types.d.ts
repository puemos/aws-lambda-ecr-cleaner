type Config = {
    DRY_RUN: string;
    API_DELAY: number;
    REPO_AGE_THRESHOLD: number;
    REPO_FIRST_N_THRESHOLD: number;
    AWS_ACCOUNT_ID: number;
    REGION: string;
    REPO_TO_CLEAN: string|string[];
    ENVS: string|string[];
}
