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
	virtual ~JsonConfigWin32();

	virtual void Write();

protected:
	JsonConfigWin32();

	virtual void InitDefaultDoc(rapidjson::Document& doc);
	virtual void Read(const rapidjson::Document& doc);
};