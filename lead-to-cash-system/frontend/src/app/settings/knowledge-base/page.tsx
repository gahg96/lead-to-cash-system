
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Search, Database, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

export default function KnowledgeBasePage() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            // Need to implement backend endpoint first, using mock for visual dev now if needed,
            // but we implemented /ai/documents in backend now.
            const data = await api.get("/ai/documents");
            setDocuments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch documents", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const files = Array.from(e.target.files);

        // Filter out duplicates or confirm with user
        const filesToUpload: File[] = [];
        for (const file of files) {
            const exists = documents.some(d => d.filename === file.name || d.title === file.name);
            if (exists) {
                if (confirm(`文件 "${file.name}" 已存在。是否继续上传？(将会创建副本)`)) {
                    filesToUpload.push(file);
                }
            } else {
                filesToUpload.push(file);
            }
        }

        if (filesToUpload.length === 0) {
            e.target.value = "";
            return;
        }

        setUploading(true);
        let successCount = 0;

        try {
            for (const file of filesToUpload) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("title", file.name);

                try {
                    await api.uploadWithProgress("/ai/upload", formData, (progress) => {
                        setUploadProgress(progress);
                    });
                    successCount++;
                } catch (err) {
                    console.error(`Failed to upload ${file.name}`, err);
                }
            }
            fetchDocuments();
            if (successCount < filesToUpload.length) {
                alert(`上传完成: ${successCount} 成功, ${filesToUpload.length - successCount} 失败`);
            }
        } catch (error) {
            console.error("Upload process failed", error);
            alert("上传流程异常");
        } finally {
            setUploading(false);
            setUploadProgress(0);
            e.target.value = "";
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`确定要删除文档 "${title}" 吗？此操作不可恢复。`)) return;

        try {
            await api.delete(`/ai/documents/${id}`);
            fetchDocuments();
        } catch (error) {
            console.error("Failed to delete document", error);
            alert("删除失败");
        }
    };

    const filteredDocs = documents.filter(d =>
        d.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">知识库管理 (RAG)</h1>
                    <p className="text-slate-500">上传企业文档供 AI 助手学习与检索</p>
                </div>
                <div className="flex gap-2">
                    <Button disabled={uploading} className="gap-2 relative">
                        <Upload className="h-4 w-4" />
                        {uploading ? `上传中...` : "上传文档"}
                        <input
                            type="file"
                            multiple
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleUpload}
                            accept=".txt,.md,.json,.pdf"
                        />
                    </Button>
                </div>
            </div>



            {
                uploading && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">正在上传...</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Progress value={uploadProgress} className="h-2" />
                                <p className="text-xs text-muted-foreground text-right">{Math.round(uploadProgress)}%</p>
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            <Card>
                <CardHeader className="pb-3 card-header">
                    <div className="flex justify-between items-center">
                        <CardTitle>已索引文档</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="搜索文档..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>文档标题</TableHead>
                                <TableHead>文件名</TableHead>
                                <TableHead>大小 (Bytes)</TableHead>
                                <TableHead>分块数 (Chunks)</TableHead>
                                <TableHead>上传时间</TableHead>
                                <TableHead className="w-[100px]">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">加载中...</TableCell>
                                </TableRow>
                            ) : filteredDocs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                        暂无文档，请上传 .txt 或 .md 文件
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredDocs.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-blue-500" />
                                            {doc.title}
                                        </TableCell>
                                        <TableCell>{doc.filename}</TableCell>
                                        <TableCell>{doc.fileSize}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                {doc.chunkCount} chunks
                                            </span>
                                        </TableCell>
                                        <TableCell>{new Date(doc.createdAt).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDelete(doc.id, doc.title)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* AI Assistant Chat Widget would go here or be global */}
        </div >
    );
}
