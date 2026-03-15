import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'server-settings.json');

export interface Settings {
  DEEPSEEK_API_KEY?: string;
  JIMENG_ACCESS_KEY?: string;
  JIMENG_SECRET_KEY?: string;
  FAL_KEY?: string;
  updatedAt?: string;
}

/**
 * 读取服务器设置
 * 优先级：server-settings.json > 环境变量
 */
export function getSettings(): Settings {
  // 先从环境变量读取（作为后备）
  const envSettings: Settings = {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    JIMENG_ACCESS_KEY: process.env.JIMENG_ACCESS_KEY,
    JIMENG_SECRET_KEY: process.env.JIMENG_SECRET_KEY,
    FAL_KEY: process.env.FAL_KEY,
  };

  try {
    // 尝试从文件读取
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const fileSettings = JSON.parse(data);
      
      // 文件设置覆盖环境变量
      return {
        ...envSettings,
        ...fileSettings,
      };
    }
  } catch (error) {
    console.error('读取设置文件失败，使用环境变量:', error);
  }

  return envSettings;
}

/**
 * 获取单个设置项
 */
export function getSetting(key: keyof Settings): string | undefined {
  const settings = getSettings();
  return settings[key];
}

/**
 * 检查必需的设置是否已配置
 */
export function checkRequiredSettings(requiredKeys: (keyof Settings)[]): {
  allConfigured: boolean;
  missing: string[];
} {
  const settings = getSettings();
  const missing = requiredKeys.filter(key => !settings[key]);
  
  return {
    allConfigured: missing.length === 0,
    missing,
  };
}
