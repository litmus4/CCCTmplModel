#include "JsonConfig.h"
#include "cocos2d.h"
#include "json/rapidjson.h"

USING_NS_CC;

JsonConfig::SubFactory* JsonConfig::s_pFactory = nullptr;
JsonConfig* JsonConfig::s_pInst = nullptr;

JsonConfig::JsonConfig()
{
	//
}

JsonConfig::~JsonConfig()
{
	DeleteCategory("Display", m_mapDisplay);
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

	Read(doc);

	if (!bExist)
	{
		rapidjson::StringBuffer buf;
		rapidjson::Writer<rapidjson::StringBuffer> writer(buf);
		doc.Accept(writer);
		FileUtils::getInstance()->writeStringToFile(buf.GetString(), CFG_FILE_PATH);
	}
}

void JsonConfig::Write()
{
	rapidjson::StringBuffer buf;
	rapidjson::Writer<rapidjson::StringBuffer> writer(buf);
	writer.StartObject();

	WriteCategory(writer, "Display", m_mapDisplay);

	writer.EndObject();
	FileUtils::getInstance()->writeStringToFile(buf.GetString(), CFG_FILE_PATH);
}

std::pair<int, int> JsonConfig::GetFrameSize()
{
	std::pair<int, int> retPair;
	CateValue* pValue = &m_mapDisplay["FrameWidth"];
	retPair.first = *(int*)pValue->pValue;
	pValue = &m_mapDisplay["FrameHeight"];
	retPair.second = *(int*)pValue->pValue;
	return retPair;
}

void JsonConfig::InitDefaultDoc(rapidjson::Document& doc)
{
	doc.SetObject();
}

void JsonConfig::Read(const rapidjson::Document& doc)
{
	ReadCategoryFromDoc(doc, "Display", m_mapDisplay);
}

void JsonConfig::ReadCategoryFromDoc(const rapidjson::Document& doc, const char* szName, tMapCategory& mapCategory)
{
	if (doc.HasMember(szName))
	{
		const rapidjson::Value& category = doc[szName];
		rapidjson::Value::ConstMemberIterator iter = category.MemberBegin();
		for (; iter != category.MemberEnd(); iter++)
		{
			CateValue value;
			value.eType = iter->value.GetType();
			value.pValue = nullptr;
			switch (value.eType)
			{
			case rapidjson::Type::kNumberType:
				value.pValue = new int; *(int*)value.pValue = iter->value.GetInt();
				break;
			case rapidjson::Type::kStringType:
				value.pValue = new std::string(); *(std::string*)value.pValue = iter->value.GetString();
				break;
			}
			mapCategory.insert(std::pair<std::string, CateValue>(iter->name.GetString(), value));
		}
	}
}

void JsonConfig::WriteCategory(rapidjson::Writer<rapidjson::StringBuffer>& writer, const char* szName,
	tMapCategory& mapCategory, std::function<bool(tMapCategory::iterator)> fnSpecial)
{
	writer.Key(szName);
	writer.StartObject();
	tMapCategory::iterator iter = mapCategory.begin();
	for (; iter != mapCategory.end(); iter++)
	{
		if (fnSpecial(iter)) continue;

		writer.Key(iter->first.c_str());
		switch (iter->second.eType)
		{
		case rapidjson::Type::kNumberType:
			writer.Int(*(int*)iter->second.pValue);
			break;
		case rapidjson::Type::kStringType:
			writer.String(((std::string*)iter->second.pValue)->c_str());
			break;
		default:
			writer.Null();
		}
	}
	writer.EndObject();
}

void JsonConfig::DeleteCategory(const char* szName, tMapCategory& mapCategory)
{
	tMapCategory::iterator iter = mapCategory.begin();
	for (; iter != mapCategory.end(); iter++)
		delete iter->second.pValue;
	mapCategory.clear();
}