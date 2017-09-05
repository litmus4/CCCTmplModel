var Random = {
    RandInt : function(nMin, nMax)
    {
        if (nMin > nMax)
        {
            var nTmp = nMin;
            nMin = nMax;
            nMax = nTmp;
        }
        else if (nMin === nMax)
            return nMin;
        return nMin + Math.floor(Math.random() * (nMax - nMin + 1));
    },

    RandFloat : function(nMin, nMax)
    {
        if (nMin > nMax)
        {
            var nTmp = nMin;
            nMin = nMax;
            nMax = nTmp;
        }
        else if (Math.abs(nMax - nMin) < 0.0000001)
            return nMin;
        return nMin + Math.random() * (nMax - nMin);
    },

    Rand_1To100 : function()
    {
        return this.RandInt(1, 100);
    },

    Rand_1To360 : function(bZeroBase)
    {
        if (bZeroBase)
            return this.RandInt(0, 359);
        return this.RandInt(1, 360);
    },

    Rand_0To100_Float : function()
    {
        return this.RandFloat(0, 100);
    },

    Rand_0To360_Float : function()
    {
        return this.RandFloat(0, 360);
    },

    Rand_0To2PI_Float : function()
    {
        return this.RandFloat(0, Math.PI * 2);
    },

    DrawLots : function(lots)
    {
        var nSize = lots.length;
        if (nSize === 0)
            return 0;
        var nIndex = this.RandInt(0, nSize - 1);
        return lots[nIndex];
    },

    DrawLotsW : function(weightLots)
    {
        var nTotalWeight = 0;
        weightLots.forEach(function(lot, i)
        {
            if (lot[1] >= 0)
                nTotalWeight += lot[1];
        });
        if (nTotalWeight === 0)
            return 0;

        var nRand = this.RandFloat(0, nTotalWeight);
        var nCurMin = 0;
        for (var i = 0; i < weightLots.length; ++i)
        {
            var lot = weightLots[i];
            if (lot[1] >= 0)
            {
                nCurMax = nCurMin + lot[1];
                if (nRand >= nCurMin && nRand < nCurMax)
                    return lot[0];
                nCurMin = nCurMax;
            }
        }
        return 0;
    },
    
    DrawLotsM : function(lots, nNum, results)
    {
        var local = [];
        lots.forEach(function(nValue, i)
        {
            if (nNum < lots.length)
                local.push(nValue);
            else
                results.push(nValue);
        });
        if (nNum >= lots.length)
            return results.length > 0;

        for (var i = 0; i < nNum; ++i)
        {
            var nIndex = this.RandInt(0, local.length - 1);
            results.push(local[nIndex]);
            local.splice(nIndex, 1);
        }
        return results.length > 0;
    },
    
    DrawLotsWM : function(weightLots, nNum, results)
    {
        var local = [];
        weightLots.forEach(function(lot, i)
        {
            if (nNum < weightLots.length)
                local.push(lot);
            else if (lot[1] >= 0)
                results.push(lot[0]);
        });
        if (nNum >= weightLots.length)
            return results.length > 0;

        var nTotalWeight = 0;
        local.forEach(function(lot, i)
        {
            if (lot[1] >= 0)
                nTotalWeight += lot[1];
        });
        if (nTotalWeight === 0)
            return false;

        for (var i = 0; i < nNum; ++i)
        {
            if (nTotalWeight <= 0)
                break;

            var nRand = this.RandFloat(0, nTotalWeight);
            var nCurMin = 0;
            for (var j = 0; j < local.length; ++j)
            {
                var lot = local[j];
                if (lot[1] >= 0)
                {
                    var nCurMax = nCurMin + lot[1];
                    if (nRand >= nCurMin && nRand < nCurMax)
                    {
                        results.push(lot[0]);
                        nTotalWeight -= lot[1];
                        local.splice(j, 1);
                        break;
                    }
                    nCurMin = nCurMax;
                }
            }
        }
        return results.length > 0;
    }
};

//module.exports = Random;//TODOJK CCC