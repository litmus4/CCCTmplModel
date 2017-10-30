var StateMachine = function()
{
    this.stateMap = {};
    this.sCurrent = null;
};

StateMachine.prototype = {
    AddState : function(sState, fnOnEnter, fnOnExit)
    {
        if (this.stateMap[sState])
            return;
        this.stateMap[sState] = {
            fnOnEnter : fnOnEnter,
            fnOnExit : fnOnExit,
            eventMap : {}
        };
    },

    AddTransfer : function(sSrcState, sEvent, sDstState)
    {
        var srcState = this.stateMap[sSrcState];
        if (!srcState)
            return false;
        if (!this.stateMap[sDstState])
            return false;

        if (!srcState.eventMap[sEvent])
        {
            srcState.eventMap[sEvent] = sDstState;
            return true;
        }
        return false;
    },

    SetState : function(sState, bForce)
    {
        if (sState == this.sCurrent)
            return true
        
        var curState = this.sCurrent ? this.stateMap[this.sCurrent] : null;
        if (!bForce)
        {
            if (!curState) return false;
            var bHaveNext = false;
            for (var sEvent in curState.eventMap)
            {
                if (curState.eventMap[sEvent] === sState)
                {
                    bHaveNext = true;
                    break;
                }
            }
            if (!bHaveNext)
                return false;
        }

        var nextState = this.stateMap[sState];
        if (nextState)
        {
            if (curState) curState.fnOnExit();
            this.sCurrent = sState;
            nextState.fnOnEnter();
            return true;
        }
        return false;
    },

    TriggerEvent : function(sEvent)
    {
        var curState = this.sCurrent ? this.stateMap[this.sCurrent] : null;
        if (!curState) return false;

        var sNextState = curState.eventMap[sEvent];
        if (sNextState)
            return this.SetState(sNextState, true);
        return false;
    },

    GetStateNum : function()
    {
        var nNum = 0;
        for (var sState in this.stateMap)
            nNum++;
        return nNum;
    },

    GetCurrentState : function()
    {
        return this.sCurrent;
    }
};

//module.exports = StateMachine;//TODOJK CCC