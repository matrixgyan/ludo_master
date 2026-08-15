import React, { useState, useEffect, useRef } from 'react';
import { HardDrive, Upload, Trash2, Copy, Check, ExternalLink, RefreshCw, FileText, Image as ImageIcon } from 'lucide-react';

interface R2StorageTabProps {
  token: string;
}

export const R2StorageTab: React.FC<R2StorageTabProps> = ({ token }) => {
  const [objects, setObjects] = useState<any[]>([]);
  const [bucketName, setBucketName] = useState('Not Configured');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [category, setCategory] = useState('assets');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchObjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/storage/objects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setObjects(data.objects || []);
      setBucketName(data.bucket || 'Not Configured');
      setIsConfigured(data.isConfigured || false);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    try {
      const res = await fetch('/api/admin/storage/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadMessage(`Successfully uploaded ${file.name} to Cloudflare R2!`);
      fetchObjects();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadMessage(`Upload error: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteObject = async (key: string) => {
    if (!window.confirm(`Delete object ${key} from Cloudflare R2?`)) return;

    try {
      const res = await fetch(`/api/admin/storage/objects/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchObjects();
      }
    } catch {
      // Handle error
    }
  };

  const copyUrl = (key: string) => {
    const url = `${window.location.origin}/api/storage/file/${encodeURIComponent(key)}`;
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => {
    fetchObjects();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0e131f] border border-slate-800/80 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-base font-bold text-white">Cloudflare R2 Object Storage & Asset Manager</h3>
            <p className="text-xs text-slate-400">
              Bucket: <span className="text-amber-400 font-mono font-bold">{bucketName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[#141b2d] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none"
          >
            <option value="avatars">Avatars</option>
            <option value="assets">Game Assets</option>
            <option value="images">Textures & UI</option>
          </select>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,application/json,text/*"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {isUploading ? 'Uploading to R2...' : 'Upload Asset'}
          </button>

          <button
            onClick={fetchObjects}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {uploadMessage && (
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-amber-400 text-xs font-medium">
          {uploadMessage}
        </div>
      )}

      {/* Storage Objects Table */}
      <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#141b2d] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Object Key / File</th>
                <th className="py-3 px-4">Content Type</th>
                <th className="py-3 px-4">Size (Bytes)</th>
                <th className="py-3 px-4">Uploaded At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {objects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No objects stored in Cloudflare R2 bucket yet. Click "Upload Asset" to upload.
                  </td>
                </tr>
              ) : (
                objects.map((obj) => (
                  <tr key={obj.key} className="hover:bg-[#141b2d]/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 font-mono font-bold text-slate-100">
                        {obj.contentType?.startsWith('image') ? (
                          <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                        )}
                        <span className="truncate max-w-xs">{obj.key}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{obj.contentType || 'binary'}</td>
                    <td className="py-3 px-4 font-mono">{(obj.sizeBytes || 0).toLocaleString()} B</td>
                    <td className="py-3 px-4 text-slate-400">
                      {obj.createdAt ? new Date(obj.createdAt).toLocaleString() : 'Recent'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => copyUrl(obj.key)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                          title="Copy Public Stream URL"
                        >
                          {copiedKey === obj.key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={`/api/storage/file/${encodeURIComponent(obj.key)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          title="Open Object in New Tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDeleteObject(obj.key)}
                          className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg transition-colors cursor-pointer"
                          title="Delete from R2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
