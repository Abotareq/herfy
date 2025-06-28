class AppErrors extends Error{
    constructor(){
        super()
    }
    createError(message , statusCode , httpStatusText){
        this.message = message;
        this.statusCode = statusCode;
        this.httpStatusText = httpStatusText;
        return this;
    }
}

export default new AppErrors();