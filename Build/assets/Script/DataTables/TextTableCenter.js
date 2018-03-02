var JsonTableParser = require("JsonTableParser");
var LoadController = require("LoadController");

var TextTableCenter = {
    textParser : null,
    captionParser : null,
    captionTagMap : {},
    storyTextParser : null,

    Init : function(sLanguage, bUseCaptionTags)
    {
        var sFolder = "DataTables/TextTable/" + sLanguage + "/";

        this.textParser = new JsonTableParser();
        this.textParser.Load(sFolder + "Text", LoadController.GetCheckFunc(), true);

        this.captionParser = new JsonTableParser();
        this.captionParser.Load(sFolder + "Caption", LoadController.GetCheckFunc(sFolder + "Caption", function(){
            if (bUseCaptionTags)
            {
                for (var sID in this.captionParser.data)
                    this.captionTagMap[this.captionParser.GetRow(sID).Tag] = sID;
            }
        }.bind(this)), true);

        this.storyTextParser = new JsonTableParser();
        this.storyTextParser.Load(sFolder + "StoryText", LoadController.GetCheckFunc(), true);
    },

    Release : function()
    {
        this.textParser = null;
        this.captionParser = null;
        this.captionTagMap = {};
        this.storyTextParser = null;
    },

    GetTextRow : function(sID)
    {
        return this.textParser.GetRow(sID);
    },

    GetText : function(sID)
    {
        var row = this.textParser.GetRow(sID);
        return row ? row.Text : "";
    },

    GetCaptionRow : function(sID)
    {
        return this.captionParser.GetRow(sID);
    },

    GetCaption : function(sID)
    {
        var row = this.captionParser.GetRow(sID);
        return row ? row.Text : "";
    },

    GetCaptionByTag : function(sTag)
    {
        var sID = this.captionTagMap[sTag];
        if (sID)
        {
            var row = this.captionParser.GetRow(sID);
            if (row)
                return row.Text;
        }
        return "";
    },

    GetStoryTextRow : function(sID)
    {
        return this.storyTextParser.GetRow(sID);
    },

    GetStoryText : function(sID)
    {
        var row = this.storyTextParser.GetRow(sID);
        return row ? row.Text : "";
    }
};

module.exports = TextTableCenter;