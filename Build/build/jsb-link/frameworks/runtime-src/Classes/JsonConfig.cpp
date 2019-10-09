#include "JsonConfig.h"
#include "cocos2d.h"
#include "json/rapidjson.h"
#include "json/stringbuffer.h"
#include "json/writer.h"

USING_NS_CC;
#define CFG_FILE_PATH "config.json"

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

	if (s_pFactory)
	{
		delete s_pFactory;
		s_pFactory = nullptr;
	}
}

void JsonConfig::Init()
{
	rapidjson::Document doc;
	bool bExist = FileUtils::getInstance()->isFileExist(CFG_FILE_PATH);
	if (bExist)
	{
		std::string strDoc = FileUtils::getInstance()->getStringFromFile(CFG_FILE_PATH);
		doc.Parse(strDoc.c_str());
	}
	else
		InitDefaultDoc(doc);

	//FLAGJK

	if (!bExist)
	{
		rapidjson::StringBuffer buf;
		rapidjson::Writer<rapidjson::StringBuffer> writer(buf);
		doc.Accept(writer);
		FileUtils::getInstance()->writeStringToFile(buf.GetString(), CFG_FILE_PATH);
	}
}

void JsonConfig::InitDefaultDoc(rapidjson::Document& doc)
{
	doc.SetObject();
}