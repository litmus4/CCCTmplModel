var LoadController = function(fnOnEnd)
{
    this.nParserNum = 0;
    this.nParsedNum = 1;
    this.fnOnEnd = fnOnEnd;
};

LoadController.prototype = {
    CheckEnd : function(err, data)
    {
        this.nParsedNum++;
        if (this.nParsedNum === this.nParserNum)
        {
            if (this.fnOnEnd)
                this.fnOnEnd();
            this.nParserNum = 0;
            this.nParsedNum = 1;
        }
    },

    GetCheckFunc : function()
    {
        if (this.nParserNum === 0)
            this.nParsedNum = 0;
        this.nParserNum++;
        return this.CheckEnd;
    }
};

module.exports = LoadController;