var LoadController = {
    nParserNum : 0,
    nParsedNum : 1,
    fnOnEnd : null,

    CheckEnd : function(err, data)
    {
        this.nParsedNum++;
        if (this.nParsedNum === this.nParserNum)
        {
            if (this.fnOnEnd)
                this.fnOnEnd();
            this.Reset(null);
        }
    },

    GetCheckFunc : function()
    {
        if (this.nParserNum === 0)
            this.nParsedNum = 0;
        this.nParserNum++;
        return this.CheckEnd.bind(this);
    },

    Reset : function(fnOnEnd)
    {
        this.nParserNum = 0;
        this.nParsedNum = 1;
        if (fnOnEnd)
            this.fnOnEnd = fnOnEnd;
    }
};

module.exports = LoadController;