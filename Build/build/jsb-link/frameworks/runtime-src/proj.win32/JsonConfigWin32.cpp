#include "JsonConfigWin32.h"
#include "cocos2d.h"
#include "json/rapidjson.h"

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

void JsonConfigWin32::InitDefaultDoc(rapidjson::Document& doc)
{
	doc.SetObject();
	rapidjson::Document::AllocatorType& allocator = doc.GetAllocator();

	rapidjson::Value display(rapidjson::kObjectType);
	display.AddMember("FrameWidth", 960, allocator);
	display.AddMember("FrameHeight", 640, allocator);
	doc.AddMember("Display", display, allocator);
}