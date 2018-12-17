exports.createCookie = function createHash(plainCookie) {
    let fillLength = plainCookie.length - 40;
    let appendedPassword;
    if(fillLength >= 0){
        appendedPassword = plainCookie.substring(0,40);
    } else {
        while(fillLength < 0){
            appendedPassword =+ '0' + plainCookie;
            fillLength++;
        }
    }
    return appendedPassword;
}
exports.santinize = function santinize(text) {

}
exports.getUserName = function getUserName(email){
    let index = email.indexOf("@");
    return email.substring(0,index);
}

exports.randomString = function randomString() {
    return (Math.random() + 1).toString(36).substring(3);
}

exports.comparePassword = function (candidatePassword, cb, bcrypt) {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
        cb(err, isMatch);
    });
};

exports.errRes = function (res, status, msg) {
    res.status(status).send({
        error: msg
    });
    return;
}