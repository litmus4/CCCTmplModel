var JsonTableParser = function()
{
    this.data = null;
    this.nIndex = 0;
};
var pt = JsonTableParser.prototype;

pt.Load = function(sFile, fnCallback)
{
    cc.loader.loadRes(sFile, function(err, data){
        if (err)
        {
            cc.error(err.message || err);
            return;
        }
        this.data = data;
        this.nIndex = 0;
        if (fnCallback)
            fnCallback(err, data);
    });
}

pt.SetString = function(sJson)
{
    this.data = JSON.parse(sJson);
    this.nIndex = 0;
}

pt.SetData = function(data)
{
    if (data && data.length > 0)
    {
        this.data = data;
        this.nIndex = 0;
    }
}

pt.ReadRow = function()
{
    if (this.nIndex + 1 >= this.data.length)
        return false;
    this.nIndex++;
    return true;
}

pt.GetValue = function(sColName)
{
    var row = this.data[this.nIndex];
    var value = row[sColName];
    if (value === null)//修改房燕良那个导出工具
        return this.data[0][sColName];
    return value;
}

pt.Reset = function()
{
    this.data = null;
    this.nIndex = 0;
}

module.exports = JsonTableParser;