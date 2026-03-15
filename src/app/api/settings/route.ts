import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 检测是否在 Vercel 环境
const isVercel = process.env.VERCEL === '1';

interface Settings {
  DEEPSEEK_API_KEY?: string;
  JIMENG_ACCESS_KEY?: string;
  JIMENG_SECRET_KEY?: string;
  updatedAt?: string;
}

// 本地开发：文件路径
const SETTINGS_FILE = path.join(process.cwd(), 'server-settings.json');

function readSettings(): Settings {
  try {
    // Vercel 环境：只从环境变量读取
    if (isVercel) {
      return {
        DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
        JIMENG_ACCESS_KEY: process.env.JIMENG_ACCESS_KEY,
        JIMENG_SECRET_KEY: process.env.JIMENG_SECRET_KEY,
      };
    }

    // 本地开发：从文件读取，回退到环境变量
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const fileSettings = JSON.parse(data);
      return {
        DEEPSEEK_API_KEY: fileSettings.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY,
        JIMENG_ACCESS_KEY: fileSettings.JIMENG_ACCESS_KEY || process.env.JIMENG_ACCESS_KEY,
        JIMENG_SECRET_KEY: fileSettings.JIMENG_SECRET_KEY || process.env.JIMENG_SECRET_KEY,
      };
    }

    // 回退到环境变量
    return {
      DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
      JIMENG_ACCESS_KEY: process.env.JIMENG_ACCESS_KEY,
      JIMENG_SECRET_KEY: process.env.JIMENG_SECRET_KEY,
    };
  } catch (error) {
    console.error('读取设置失败:', error);
    return {};
  }
}

function writeSettings(settings: Settings): void {
  if (isVercel) {
    throw new Error('Vercel 环境不支持文件写入，请使用 Vercel Dashboard 配置环境变量');
  }

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

    return NextResponse.json({
      success: true,
      isVercel,
      configured: {
        DEEPSEEK_API_KEY: !!settings.DEEPSEEK_API_KEY,
        JIMENG_ACCESS_KEY: !!settings.JIMENG_ACCESS_KEY,
        JIMENG_SECRET_KEY: !!settings.JIMENG_SECRET_KEY,
      },
      updatedAt: settings.updatedAt,
      message: isVercel
        ? '运行在 Vercel 环境，请使用 Dashboard 配置环境变量'
        : '运行在本地环境，可以保存到文件',
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

    // Vercel 环境：提示用户使用 Dashboard
    if (isVercel) {
      return NextResponse.json({
        success: false,
        isVercel: true,
        error: 'Vercel 部署无法通过网页保存设置',
        solution: '请使用 Vercel Dashboard 配置环境变量',
        steps: [
          '1. 访问 https://vercel.com/dashboard',
          '2. 选择项目 → Settings → Environment Variables',
          '3. 添加环境变量：',
          '   - DEEPSEEK_API_KEY',
          '   - JIMENG_ACCESS_KEY',
          '   - JIMENG_SECRET_KEY',
          '4. 点击 Save 并重新部署'
        ],
        docs: 'https://vercel.com/docs/environment-variables'
      });
    }

    // 本地开发：写入文件
    const settings = readSettings();

    if (DEEPSEEK_API_KEY !== undefined) {
      settings.DEEPSEEK_API_KEY = DEEPSEEK_API_KEY || undefined;
    }
    if (JIMENG_ACCESS_KEY !== undefined) {
      settings.JIMENG_ACCESS_KEY = JIMENG_ACCESS_KEY || undefined;
    }
    if (JIMENG_SECRET_KEY !== undefined) {
      settings.JIMENG_SECRET_KEY = JIMENG_SECRET_KEY || undefined;
    }

    writeSettings(settings);

    // 更新环境变量（当前进程）
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
      isVercel: false,
      message: '设置已保存到本地文件',
      configured: {
        DEEPSEEK_API_KEY: !!settings.DEEPSEEK_API_KEY,
        JIMENG_ACCESS_KEY: !!settings.JIMENG_ACCESS_KEY,
        JIMENG_SECRET_KEY: !!settings.JIMENG_SECRET_KEY,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || '保存设置失败' },
      { status: 500 }
    );
  }
}

// 删除设置
export async function DELETE(request: NextRequest) {
  try {
    if (isVercel) {
      return NextResponse.json({
        success: false,
        error: 'Vercel 环境不支持通过网页删除设置',
        solution: '请在 Vercel Dashboard 中删除环境变量'
      });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key || !['DEEPSEEK_API_KEY', 'JIMENG_ACCESS_KEY', 'JIMENG_SECRET_KEY'].includes(key)) {
      return NextResponse.json(
        { success: false, error: '无效的配置项' },
        { status: 400 }
      );
    }

    const settings = readSettings();
    delete (settings as any)[key];
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
