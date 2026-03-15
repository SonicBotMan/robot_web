import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'server-settings.json');

interface Settings {
  DEEPSEEK_API_KEY?: string;
  JIMENG_ACCESS_KEY?: string;
  JIMENG_SECRET_KEY?: string;
  updatedAt?: string;
}

function readSettings(): Settings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('读取设置失败:', error);
  }
  return {};
}

function writeSettings(settings: Settings): void {
  try {
    settings.updatedAt = new Date().toISOString();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('写入设置失败:', error);
    throw error;
  }
}

// 获取设置（不返回敏感信息）
export async function GET() {
  try {
    const settings = readSettings();
    
    // 返回哪些字段已配置，但不返回实际值
    return NextResponse.json({
      success: true,
      configured: {
        DEEPSEEK_API_KEY: !!settings.DEEPSEEK_API_KEY,
        JIMENG_ACCESS_KEY: !!settings.JIMENG_ACCESS_KEY,
        JIMENG_SECRET_KEY: !!settings.JIMENG_SECRET_KEY,
      },
      updatedAt: settings.updatedAt,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '读取设置失败' },
      { status: 500 }
    );
  }
}

// 更新设置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { DEEPSEEK_API_KEY, JIMENG_ACCESS_KEY, JIMENG_SECRET_KEY } = body;

    // 验证至少提供一个字段
    if (!DEEPSEEK_API_KEY && !JIMENG_ACCESS_KEY && !JIMENG_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: '请至少提供一个配置项' },
        { status: 400 }
      );
    }

    // 读取现有设置
    const settings = readSettings();

    // 只更新提供的字段（允许部分更新）
    if (DEEPSEEK_API_KEY !== undefined) {
      settings.DEEPSEEK_API_KEY = DEEPSEEK_API_KEY || undefined;
    }
    if (JIMENG_ACCESS_KEY !== undefined) {
      settings.JIMENG_ACCESS_KEY = JIMENG_ACCESS_KEY || undefined;
    }
    if (JIMENG_SECRET_KEY !== undefined) {
      settings.JIMENG_SECRET_KEY = JIMENG_SECRET_KEY || undefined;
    }

    // 写入设置
    writeSettings(settings);

    // 同时更新环境变量（立即生效）
    if (settings.DEEPSEEK_API_KEY) {
      process.env.DEEPSEEK_API_KEY = settings.DEEPSEEK_API_KEY;
    }
    if (settings.JIMENG_ACCESS_KEY) {
      process.env.JIMENG_ACCESS_KEY = settings.JIMENG_ACCESS_KEY;
    }
    if (settings.JIMENG_SECRET_KEY) {
      process.env.JIMENG_SECRET_KEY = settings.JIMENG_SECRET_KEY;
    }

    return NextResponse.json({
      success: true,
      message: '设置已保存',
      configured: {
        DEEPSEEK_API_KEY: !!settings.DEEPSEEK_API_KEY,
        JIMENG_ACCESS_KEY: !!settings.JIMENG_ACCESS_KEY,
        JIMENG_SECRET_KEY: !!settings.JIMENG_SECRET_KEY,
      },
    });
  } catch (error) {
    console.error('保存设置失败:', error);
    return NextResponse.json(
      { success: false, error: '保存设置失败' },
      { status: 500 }
    );
  }
}

// 删除设置
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key || !['DEEPSEEK_API_KEY', 'JIMENG_ACCESS_KEY', 'JIMENG_SECRET_KEY'].includes(key)) {
      return NextResponse.json(
        { success: false, error: '无效的配置项' },
        { status: 400 }
      );
    }

    const settings = readSettings();
    delete settings[key as keyof Settings];
    writeSettings(settings);

    return NextResponse.json({
      success: true,
      message: `${key} 已删除`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '删除设置失败' },
      { status: 500 }
    );
  }
}
