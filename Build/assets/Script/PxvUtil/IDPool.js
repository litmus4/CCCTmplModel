var IDPool = function(nMin, nMax, nInvalid)
{
    if (nMin > nMax)
    {
        var nTmp = nMin;
        nMin = nMax;
        nMax = nTmp;
    }
    else if (nMin === nMax)
        nMax++;

    this.nMin = nMin;
    this.nMax = nMax;
    this.nInvalid = nInvalid;
    if (nInvalid === nMin)
        this.nCur = nMin + 1;
    else
        this.nCur = nMin;

    this.usedFlags = {};
    this.freeFlags = {};
    this.nFreeNum = 0;
};

IDPool.prototype = {
    Generate : function()
    {
        var nRet = this.nCur;
        if (this.nFreeNum === 0)
        {
            if (this.nCur > this.nMax)
                return this.nInvalid;
            while (this.usedFlags[this.nCur] || this.nCur === this.nInvalid)
                nRet = ++this.nCur;
            this.nCur++;
            if (this.nCur === this.nInvalid)
                this.nCur++;
        }
        else
        {
            nRet = Object.keys(this.freeFlags)[0];
            delete this.freeFlags[nRet];
            this.nFreeNum--;
        }
        this.usedFlags[nRet] = true;
        return nRet;
    },

    Free : function(nID)
    {
        if (this.usedFlags[nID])
        {
            delete this.usedFlags[nID];
            this.freeFlags[nID] = true;
            this.nFreeNum++;
        }
    },

    Declare : function(nID)
    {
        if (!this.freeFlags[nID])
        {
            if (nID < this.nMin || nID > this.nMax || nID === this.nInvalid)
                return;
        }
        else
        {
            delete this.freeFlags[nID];
            this.nFreeNum--;
        }
        this.usedFlags[nID] = true;
    }
};

module.exports = IDPool;