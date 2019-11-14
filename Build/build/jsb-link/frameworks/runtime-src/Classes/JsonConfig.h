#pragma once
#include "json/document.h"
#include "json/stringbuffer.h"
#include "json/writer.h"
#include <map>
#include <functional>

#define CFG_FILE_PATH "config.json"

class JsonConfig
{
public:
	class SubFactory
	{
	protected:
		friend class JsonConfig;
		virtual JsonConfig* New() = 0;
	};
	static SubFactory* s_pFactory;

public:
	virtual ~JsonConfig();
	static JsonConfig* GetInstance();
	static void DeleteInstance();

	void Init();

	virtual void Write();

	//FLAGJK

protected:
	struct CateValue
	{
		rapidjson::Type eType;
		void* pValue;
	};
	typedef std::map<std::string, CateValue> tMapCategory;

protected:
	JsonConfig();
	static JsonConfig* s_pInst;

	virtual void InitDefaultDoc(rapidjson::Document& doc);
	virtual void Read(const rapidjson::Document& doc);
	void ReadCategoryFromDoc(const rapidjson::Document& doc, const char* szName, tMapCategory& mapCategory);

	void WriteCategory(rapidjson::Writer<rapidjson::StringBuffer>& writer,
		const char* szName, tMapCategory& mapCategory,
		std::function<bool(tMapCategory::iterator)> fnSpecial =
		[](tMapCategory::iterator iter)->bool{ return false; });

	void DeleteCategory(const char* szName, tMapCategory& mapCategory);

protected:
	tMapCategory m_mapDisplay;
};