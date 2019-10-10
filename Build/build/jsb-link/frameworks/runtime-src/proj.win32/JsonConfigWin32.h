#pragma once
#include "JsonConfig.h"

class JsonConfigWin32 : public JsonConfig
{
public:
	class SubFactoryWin32 : public JsonConfig::SubFactory
	{
	protected:
		friend class JsonConfig;
		virtual JsonConfig* New();
	};

public:
	JsonConfigWin32();
	virtual ~JsonConfigWin32();

protected:
	virtual void InitDefaultDoc(rapidjson::Document& doc);
};