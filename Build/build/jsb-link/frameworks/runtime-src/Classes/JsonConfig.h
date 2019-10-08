#pragma once

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

protected:
	JsonConfig();
	static JsonConfig* s_pInst;

	//
};