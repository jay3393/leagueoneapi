module.exports.timeElapsed = function(func, oldtime) {
    console.log(`${func} took ${(new Date - oldtime) / 1000}s`);
}