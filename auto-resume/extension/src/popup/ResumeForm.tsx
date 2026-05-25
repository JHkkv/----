import React, { useState, useEffect } from 'react';
import type { Resume, ResumeInput } from '../../../shared/types';
import { useWs } from './useWs';

const emptyForm: ResumeInput = {
  name: '',
  phone: '',
  email: '',
  workYears: 0,
  currentRole: '',
  skills: [],
  projects: [],
  education: '',
  school: '',
};

const ResumeForm: React.FC = () => {
  const { connected, send } = useWs();
  const [form, setForm] = useState<ResumeInput>(emptyForm);
  const [skillsText, setSkillsText] = useState('');
  const [projectsText, setProjectsText] = useState('');
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!connected) return;
    send({ type: 'resume:get' }).then(res => {
      if (res.success && res.data) {
        const r = res.data as Resume;
        setForm({
          name: r.name, phone: r.phone, email: r.email,
          workYears: r.workYears, currentRole: r.currentRole,
          skills: r.skills, projects: r.projects,
          education: r.education, school: r.school,
        });
        setSkillsText(r.skills.join(', '));
        setProjectsText(r.projects.join(', '));
      }
    });
  }, [connected, send]);

  const handleSave = async () => {
    const toSave: ResumeInput = {
      ...form,
      skills: skillsText.split(',').map(s => s.trim()).filter(Boolean),
      projects: projectsText.split(',').map(s => s.trim()).filter(Boolean),
    };
    const res = await send({ type: 'resume:save', payload: toSave });
    if (res.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:9527/api/resume/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.data.extracted) {
        const ex = json.data.extracted;
        setForm(prev => ({
          ...prev,
          name: ex.name || prev.name,
          phone: ex.phone || prev.phone,
          email: ex.email || prev.email,
        }));
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const updateField = (field: keyof ResumeInput, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const inputClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">简历信息</h2>
        <label className="text-xs text-brand-600 cursor-pointer hover:underline">
          {uploading ? '解析中...' : '上传PDF/Word'}
          <input type="file" accept=".pdf,.docx" onChange={handleUpload} className="hidden" />
        </label>
      </div>

      <InputRow label="姓名">
        <input className={inputClass} value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="张三" />
      </InputRow>
      <InputRow label="手机">
        <input className={inputClass} value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="13800138000" />
      </InputRow>
      <InputRow label="邮箱">
        <input className={inputClass} value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="zhang@example.com" />
      </InputRow>
      <InputRow label="工作年限">
        <input className={inputClass} type="number" value={form.workYears} onChange={e => updateField('workYears', parseInt(e.target.value) || 0)} />
      </InputRow>
      <InputRow label="当前职位">
        <input className={inputClass} value={form.currentRole} onChange={e => updateField('currentRole', e.target.value)} placeholder="高级前端工程师" />
      </InputRow>
      <InputRow label="技能（逗号分隔）">
        <input className={inputClass} value={skillsText} onChange={e => setSkillsText(e.target.value)} placeholder="React, TypeScript, Node.js" />
      </InputRow>
      <InputRow label="项目经验（逗号分隔）">
        <input className={inputClass} value={projectsText} onChange={e => setProjectsText(e.target.value)} placeholder="电商后台, 用户增长系统" />
      </InputRow>
      <InputRow label="学历">
        <input className={inputClass} value={form.education} onChange={e => updateField('education', e.target.value)} placeholder="本科" />
      </InputRow>
      <InputRow label="学校">
        <input className={inputClass} value={form.school} onChange={e => updateField('school', e.target.value)} placeholder="清华大学" />
      </InputRow>

      <button
        onClick={handleSave}
        className="w-full bg-brand-600 text-white py-2 rounded font-medium text-sm hover:bg-brand-700 transition-colors"
      >
        {saved ? '已保存' : '保存简历'}
      </button>
    </div>
  );
};

const InputRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-xs text-gray-500 mb-1 block">{label}</label>
    {children}
  </div>
);

export default ResumeForm;
