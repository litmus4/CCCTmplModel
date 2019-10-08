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