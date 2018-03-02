var LoadController = {
    nParserNum : 0,
    nParsedNum : 1,
    exLoadFuncs : {},
    fnOnEnd : null,

    CheckEnd : function(sFile, err, data)
    {
        this.nParsedNum++;
        if (this.exLoadFuncs[sFile])
        {
            this.exLoadFuncs[sFile]();
            delete this.exLoadFuncs[sFile];
        }
        if (this.nParsedNum === this.nParserNum)
        {
            if (this.fnOnEnd)
                this.fnOnEnd();
            this.Reset(null);
        }
    },

    GetCheckFunc : function(sFile, fnOnExLoad)
    {
        if (this.nParserNum === 0)
            this.nParsedNum = 0;
        this.nParserNum++;
        if (sFile)
            this.exLoadFuncs[sFile] = fnOnExLoad;
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