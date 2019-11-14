#include "JsonConfigWin32.h"
#include "cocos2d.h"
#include "json/rapidjson.h"

USING_NS_CC;

JsonConfig* JsonConfigWin32::SubFactoryWin32::New()
{
	return new JsonConfigWin32();
}

JsonConfigWin32::JsonConfigWin32()
{
	//
}

JsonConfigWin32::~JsonConfigWin32()
{
	//
}

void JsonConfigWin32::Write()
{
	rapidjson::StringBuffer buf;
	rapidjson::Writer<rapidjson::StringBuffer> writer(buf);
	writer.StartObject();

	WriteCategory(writer, "Display", m_mapDisplay, [](tMapCategory::iterator iter)->bool{
		//
		return false;
	});

	writer.EndObject();
	FileUtils::getInstance()->writeStringToFile(buf.GetString(), CFG_FILE_PATH);
}

void JsonConfigWin32::InitDefaultDoc(rapidjson::Document& doc)
{
	doc.SetObject();
	rapidjson::Document::AllocatorType& allocator = doc.GetAllocator();

	rapidjson::Value display(rapidjson::kObjectType);
	display.AddMember("FrameWidth", 960, allocator);
	display.AddMember("FrameHeight", 640, allocator);
	doc.AddMember("Display", display, allocator);
}

void JsonConfigWin32::Read(const rapidjson::Document& doc)
{
	ReadCategoryFromDoc(doc, "Display", m_mapDisplay);
	//ReadCategorySpiecial
}