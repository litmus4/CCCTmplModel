#pragma once
#include "json/document.h"

class JsonConfig
{
public:
	class SubFactory
	{
	public:
		virtual JsonConfig* New() = 0;
	};
	static SubFactory* s_pFactory;

public:
	virtual ~JsonConfig();
	static JsonConfig* GetInstance();
	static void DeleteInstance();

	void Init();

protected:
	JsonConfig();
	static JsonConfig* s_pInst;

	virtual void InitDefaultDoc(rapidjson::Document& doc);
};