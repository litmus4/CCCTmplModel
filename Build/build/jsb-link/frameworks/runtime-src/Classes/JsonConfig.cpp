#include "JsonConfig.h"
#include "cocos2d.h"
#include "json/rapidjson.h"

JsonConfig::SubFactory* JsonConfig::s_pFactory = nullptr;
JsonConfig* JsonConfig::s_pInst = nullptr;

JsonConfig::JsonConfig()
{
	//
}

JsonConfig::~JsonConfig()
{
	//
}

JsonConfig* JsonConfig::GetInstance()
{
	if (!s_pInst && s_pFactory)
		s_pInst = s_pFactory->New();
	return s_pInst;
}

void JsonConfig::DeleteInstance()
{
	if (s_pInst)
	{
		delete s_pInst;
		s_pInst = nullptr;
	}
}