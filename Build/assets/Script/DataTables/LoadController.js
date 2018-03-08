var LoadController = {
    nParserNum : 0,
    nParsedNum : 1,
    exLoadFuncs : {},
    fnOnProgress : null,
    fnOnEnd : null,

    CheckEnd : function(sFile, err, data)
    {
        this.nParsedNum++;
        if (this.exLoadFuncs[sFile])
        {
            this.exLoadFuncs[sFile]();
            delete this.exLoadFuncs[sFile];
        }
        if (this.fnOnProgress && this.nParserNum > 0)
            this.fnOnProgress(Math.min(this.nParsedNum / this.nParserNum, 1));
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

    Reset : function(fnOnProgress, fnOnEnd)
    {
        this.nParserNum = 0;
        this.nParsedNum = 1;
        if (fnOnProgress)
            this.fnOnProgress = fnOnProgress;
        if (fnOnEnd)
            this.fnOnEnd = fnOnEnd;
    }
};

module.exports = LoadController;