var JsonTableParser = function()
{
    this.data = null;
    this.nIndex = 0;
};
var pt = JsonTableParser.prototype;

pt.Load = function(sFile, fnCallback, bMap)
{
    cc.loader.loadRes(sFile, function(err, asset){
        if (err)
        {
            cc.error(err.message || err);
            return;
        }
        this.data = asset.json;
        this.nIndex = bMap ? -1 : 0;
        if (fnCallback)
            fnCallback(sFile, err, asset.json);
    }.bind(this));
}

pt.SetString = function(sJson, bMap)
{
    this.data = JSON.parse(sJson);
    this.nIndex = bMap ? -1 : 0;
}

pt.SetData = function(data, bMap)
{
    if (data && data.length > 0)
    {
        this.data = data;
        this.nIndex = bMap ? -1 : 0;
    }
}

pt.ReadRow = function()
{
    if (this.nIndex < 0 || this.nIndex + 1 >= this.data.length)
        return false;
    this.nIndex++;
    return true;
}

pt.GetValue = function(sColName)
{
    if (this.nIndex < 0)
        return null;
    var row = this.data[this.nIndex];
    var value = row[sColName];
    if (value === null)//TODOJK 还是得修改房燕良那个导出工具
        return this.data[0][sColName];
    return value;
}

pt.GetRow = function(sID)
{
    if (this.nIndex >= 0)
        return null;
    return this.data[sID];
}

pt.Reset = function()
{
    this.data = null;
    this.nIndex = 0;
}

module.exports = JsonTableParser;