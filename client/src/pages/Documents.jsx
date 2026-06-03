import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Upload, Trash2, FileText } from 'lucide-react';
import { documentApi } from '../api/client';

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const load = () => documentApi.list().then((res) => setDocs(res.data.data));

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await documentApi.upload(file);
      toast.success('Document uploaded and indexed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    try {
      await documentApi.delete(id);
      toast.success('Document deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-slate-500">Upload PDF, DOCX, or TXT for RAG retrieval</p>
        </div>
        <label className="btn-primary cursor-pointer">
          <Upload size={16} className="mr-2" />
          {uploading ? 'Processing...' : 'Upload Document'}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="grid gap-4">
        {docs.map((doc) => (
          <div key={doc._id} className="card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-slate-100 p-3">
                <FileText className="text-slate-600" size={24} />
              </div>
              <div>
                <p className="font-medium">{doc.originalName}</p>
                <p className="text-sm text-slate-500">
                  {(doc.size / 1024).toFixed(1)} KB · {doc.chunkCount || 0} chunks ·{' '}
                  <span
                    className={
                      doc.status === 'ready'
                        ? 'text-emerald-600'
                        : doc.status === 'failed'
                          ? 'text-red-600'
                          : 'text-amber-600'
                    }
                  >
                    {doc.status}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(doc._id)}
              className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {!docs.length && (
          <div className="card py-12 text-center text-slate-500">
            No documents yet. Upload your first research source.
          </div>
        )}
      </div>
    </div>
  );
}
