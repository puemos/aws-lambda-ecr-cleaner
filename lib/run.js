const run = (config, ecr, ecs) => {
    const emptyArrayFunc = x => [];
    const filterImagesByDateThreshold = config.REPO_AGE_THRESHOLD
        ? lib.filterImagesByDateThreshold(config, ecr, ecs)
        : emptyArrayFunc;
    const filterImagesByFirstN = config.REPO_FIRST_N_THRESHOLD
        ? lib.filterImagesByFirstN(config, ecr, ecs)
        : emptyArrayFunc;
    return lib
        .getRepoImages(config, ecr, ecs)
        .tap(() => Promise.delay(config.API_DELAY))
        .then(images => {
            return Promise.all([filterImagesByDateThreshold(images), filterImagesByFirstN(images)]);
        })
        .then(images => {
            const res = R.intersection(images[0], images[1]);
            return res;
        })
        .then(lib.filterOutActiveImages(config, ecr, ecs))
        .then(lib.deleteImages(config, ecr, ecs));
};

module.exports = run;
