'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ConfiguredKeys {
  DEEPSEEK_API_KEY: boolean;
  JIMENG_ACCESS_KEY: boolean;
  JIMENG_SECRET_KEY: boolean;
}

interface SettingsResponse {
  success: boolean;
  isVercel?: boolean;
  configured: ConfiguredKeys;
  message?: string;
  error?: string;
  solution?: string;
  steps?: string[];
  docs?: string;
}

export default function SettingsPage() {
  const [configured, setConfigured] = useState<ConfiguredKeys>({
    DEEPSEEK_API_KEY: false,
    JIMENG_ACCESS_KEY: false,
    JIMENG_SECRET_KEY: false,
  });
  const [isVercel, setIsVercel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showVercelGuide, setShowVercelGuide] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState({
    DEEPSEEK_API_KEY: '',
    JIMENG_ACCESS_KEY: '',
    JIMENG_SECRET_KEY: '',
  });

  // 加载配置状态
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data: SettingsResponse = await response.json();
      if (data.success) {
        setConfigured(data.configured);
        setIsVercel(data.isVercel || false);
        if (data.isVercel) {
          setShowVercelGuide(true);
        }
      }
    } catch (error) {
      showMessage('error', '加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data: SettingsResponse = await response.json();

      if (data.success) {
        showMessage('success', '设置已保存！');
        setConfigured(data.configured);
        setFormData({
          DEEPSEEK_API_KEY: '',
          JIMENG_ACCESS_KEY: '',
          JIMENG_SECRET_KEY: '',
        });
      } else if (data.isVercel) {
        // Vercel 环境，显示引导
        setShowVercelGuide(true);
        showMessage('info', 'Vercel 部署需要通过 Dashboard 配置');
      } else {
        showMessage('error', data.error || '保存失败');
      }
    } catch (error) {
      showMessage('error', '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (key: keyof ConfiguredKeys) => {
    if (!confirm(`确定要删除 ${key} 吗？`)) return;

    try {
      const response = await fetch(`/api/settings?key=${key}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', `${key} 已删除`);
        setConfigured((prev) => ({ ...prev, [key]: false }));
      } else {
        showMessage('error', data.error || '删除失败');
      }
    } catch (error) {
      showMessage('error', '删除失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* 导航 */}
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🚀 太空设计工作坊
          </Link>
          <Link
            href="/workshop"
            className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
          >
            返回工作坊
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">⚙️ 模型设置</h1>
          <p className="text-gray-400">配置 AI 模型的 API 密钥</p>
        </div>

        {/* 消息提示 */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-500/20 border border-green-500/50'
                : message.type === 'info'
                ? 'bg-blue-500/20 border border-blue-500/50'
                : 'bg-red-500/20 border border-red-500/50'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Vercel 环境提示 */}
        {isVercel && showVercelGuide && (
          <div className="mb-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              ⚠️ Vercel 部署环境
            </h2>
            <p className="mb-4 text-gray-300">
              Vercel 是无服务器环境，无法通过网页保存设置到文件。请使用 Vercel Dashboard 配置环境变量。
            </p>
            <div className="bg-black/20 p-4 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">配置步骤：</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                <li>访问 <a href="https://vercel.com/dashboard" target="_blank" className="text-purple-400 hover:underline">Vercel Dashboard</a></li>
                <li>选择项目 → Settings → Environment Variables</li>
                <li>添加以下环境变量：
                  <ul className="ml-6 mt-1 space-y-1 text-gray-400">
                    <li>• <code className="bg-white/10 px-1 rounded">DEEPSEEK_API_KEY</code></li>
                    <li>• <code className="bg-white/10 px-1 rounded">JIMENG_ACCESS_KEY</code></li>
                    <li>• <code className="bg-white/10 px-1 rounded">JIMENG_SECRET_KEY</code></li>
                  </ul>
                </li>
                <li>点击 Save</li>
                <li>重新部署项目（Deployments → 最新的部署 → Redeploy）</li>
              </ol>
            </div>
            <a
              href="https://vercel.com/docs/environment-variables"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline text-sm"
            >
              📚 Vercel 环境变量文档
            </a>
          </div>
        )}

        {/* 当前配置状态 */}
        <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10">
          <h2 className="text-xl font-semibold mb-4">📊 配置状态</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(configured).map(([key, isConfigured]) => (
              <div
                key={key}
                className={`p-4 rounded-lg border ${
                  isConfigured
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400">{key}</div>
                    <div className="font-semibold">
                      {isConfigured ? '✅ 已配置' : '❌ 未配置'}
                    </div>
                  </div>
                  {isConfigured && !isVercel && (
                    <button
                      onClick={() => handleDelete(key as keyof ConfiguredKeys)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 设置表单 */}
        {!isVercel && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* DeepSeek API Key */}
            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
              <label className="block mb-2 font-semibold">
                🔑 DeepSeek API Key
                {configured.DEEPSEEK_API_KEY && (
                  <span className="ml-2 text-sm text-green-400">(已配置)</span>
                )}
              </label>
              <input
                type="password"
                value={formData.DEEPSEEK_API_KEY}
                onChange={(e) =>
                  setFormData({ ...formData, DEEPSEEK_API_KEY: e.target.value })
                }
                placeholder="sk-..."
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-purple-500 transition"
              />
              <p className="mt-2 text-sm text-gray-400">
                从{' '}
                <a
                  href="https://platform.deepseek.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline"
                >
                  DeepSeek 平台
                </a>{' '}
                获取 API Key
              </p>
            </div>

            {/* 即梦 API Keys */}
            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-lg font-semibold mb-4">🎨 即梦 API 配置</h3>

              <div className="space-y-4">
                <div>
                  <label className="block mb-2">
                    Access Key
                    {configured.JIMENG_ACCESS_KEY && (
                      <span className="ml-2 text-sm text-green-400">(已配置)</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={formData.JIMENG_ACCESS_KEY}
                    onChange={(e) =>
                      setFormData({ ...formData, JIMENG_ACCESS_KEY: e.target.value })
                    }
                    placeholder="AK..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="block mb-2">
                    Secret Key
                    {configured.JIMENG_SECRET_KEY && (
                      <span className="ml-2 text-sm text-green-400">(已配置)</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={formData.JIMENG_SECRET_KEY}
                    onChange={(e) =>
                      setFormData({ ...formData, JIMENG_SECRET_KEY: e.target.value })
                    }
                    placeholder="SK..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                <p className="text-sm text-gray-400">
                  从{' '}
                  <a
                    href="https://console.volcengine.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:underline"
                  >
                    火山引擎控制台
                  </a>{' '}
                  获取 Access Key 和 Secret Key
                </p>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : '💾 保存设置'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    DEEPSEEK_API_KEY: '',
                    JIMENG_ACCESS_KEY: '',
                    JIMENG_SECRET_KEY: '',
                  })
                }
                className="px-6 py-3 bg-white/10 rounded-lg font-semibold hover:bg-white/20 transition"
              >
                清空表单
              </button>
            </div>
          </form>
        )}

        {/* Vercel 环境的替代提示 */}
        {isVercel && (
          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
            <h3 className="text-lg font-semibold mb-3">💡 在 Vercel 上配置</h3>
            <p className="text-gray-400 mb-4">
              由于 Vercel 是无服务器环境，请按照上方的步骤在 Vercel Dashboard 中配置环境变量。
            </p>
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition"
            >
              打开 Vercel Dashboard
            </a>
          </div>
        )}

        {/* 说明 */}
        <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <h3 className="font-semibold mb-2">💡 使用说明</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            {isVercel ? (
              <>
                <li>• Vercel 环境需要通过 Dashboard 配置环境变量</li>
                <li>• 配置后需要重新部署才能生效</li>
                <li>• 环境变量会加密存储在 Vercel 平台</li>
              </>
            ) : (
              <>
                <li>• 所有密钥将加密存储在服务器端</li>
                <li>• 配置后立即生效，无需重启服务</li>
                <li>• 可以随时更新或删除已配置的密钥</li>
                <li>• 密钥仅用于 API 调用，不会暴露给客户端</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
