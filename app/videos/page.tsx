"use client";

import { useEffect, useState, useRef } from "react";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Video, Plus, Upload, Trash2, Eye, Edit, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

const R2_WORKER_URL = "https://yeoju-r2-worker.kkyg9300.workers.dev";

const categories = ["뉴스", "맛집", "여행", "일상", "정보"];

export default function VideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "일상",
    duration: 0,
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setVideos(data);
    setLoading(false);
  };

  const uploadToR2 = async (file: File, folder: string) => {
    const fileName = `${folder}/${Date.now()}_${file.name}`;
    
    const response = await fetch(`${R2_WORKER_URL}/${fileName}`, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!response.ok) throw new Error("Upload failed");
    
    const result = await response.json();
    return result.url;
  };

  const handleSubmit = async () => {
    if (!formData.title || !videoFile) {
      alert("제목과 영상 파일은 필수입니다");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // 영상 업로드
      setUploadProgress(30);
      const videoUrl = await uploadToR2(videoFile, "videos");
      
      // 썸네일 업로드 (있으면)
      setUploadProgress(60);
      let thumbnailUrl = "";
      if (thumbnailFile) {
        thumbnailUrl = await uploadToR2(thumbnailFile, "thumbnails");
      }

      // DB 저장
      setUploadProgress(80);
      const { error } = await supabase.from("videos").insert({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        duration: formData.duration,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        view_count: 0,
      });

      if (error) throw error;

      setUploadProgress(100);
      alert("영상이 업로드되었습니다!");
      setDialogOpen(false);
      resetForm();
      fetchVideos();
    } catch (error) {
      console.error(error);
      alert("업로드 중 오류가 발생했습니다");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: number, videoUrl: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    // R2에서 파일 삭제
    try {
      const fileName = videoUrl.replace(R2_WORKER_URL + "/", "");
      await fetch(`${R2_WORKER_URL}/${fileName}`, { method: "DELETE" });
    } catch (e) {
      console.error("R2 삭제 실패:", e);
    }

    // DB에서 삭제
    await supabase.from("videos").delete().eq("id", id);
    fetchVideos();
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", category: "일상", duration: 0 });
    setVideoFile(null);
    setThumbnailFile(null);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">영상관리</h1>
            <p className="text-slate-500 mt-1">영상 업로드 및 관리</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                영상 업로드
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>새 영상 업로드</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* 제목 */}
                <div>
                  <Label>제목 *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="영상 제목을 입력하세요"
                  />
                </div>

                {/* 설명 */}
                <div>
                  <Label>설명</Label>
                  <textarea
                    className="w-full p-3 border rounded-lg resize-none h-24"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="영상 설명을 입력하세요"
                  />
                </div>

                {/* 카테고리 & 재생시간 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>카테고리</Label>
                    <select
                      className="w-full p-2 border rounded-lg"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>재생시간 (초)</Label>
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="예: 180"
                    />
                  </div>
                </div>

                {/* 영상 파일 */}
                <div>
                  <Label>영상 파일 *</Label>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  />
                  <div
                    onClick={() => videoInputRef.current?.click()}
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-emerald-500 transition-colors"
                  >
                    {videoFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <Video className="h-5 w-5 text-emerald-600" />
                        <span className="text-emerald-600 font-medium">
                          {videoFile.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setVideoFile(null);
                          }}
                        >
                          <X className="h-4 w-4 text-slate-400" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                        <p className="text-slate-500">클릭하여 영상 선택</p>
                        <p className="text-sm text-slate-400">MP4, MOV 권장</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 썸네일 */}
                <div>
                  <Label>썸네일 (선택)</Label>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      setThumbnailFile(e.target.files?.[0] || null)
                    }
                  />
                  <div
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-emerald-500 transition-colors"
                  >
                    {thumbnailFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-emerald-600 font-medium">
                          {thumbnailFile.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setThumbnailFile(null);
                          }}
                        >
                          <X className="h-4 w-4 text-slate-400" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-slate-500">클릭하여 썸네일 선택</p>
                    )}
                  </div>
                </div>

                {/* 업로드 진행률 */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-slate-500 text-center">
                      업로드 중... {uploadProgress}%
                    </p>
                  </div>
                )}

                {/* 버튼 */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={uploading}
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={uploading}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {uploading ? "업로드 중..." : "업로드"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 영상 목록 */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>재생시간</TableHead>
                  <TableHead>조회수</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      로딩중...
                    </TableCell>
                  </TableRow>
                ) : videos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      등록된 영상이 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  videos.map((video) => (
                    <TableRow key={video.id}>
                      <TableCell className="font-medium">{video.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {video.thumbnail_url && (
                            <img
                              src={video.thumbnail_url}
                              alt=""
                              className="w-16 h-10 object-cover rounded"
                            />
                          )}
                          <span className="font-medium">{video.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{video.category}</Badge>
                      </TableCell>
                      <TableCell>{formatDuration(video.duration)}</TableCell>
                      <TableCell>{video.view_count?.toLocaleString()}</TableCell>
                      <TableCell>{formatDate(video.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(video.video_url, "_blank")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(video.id, video.video_url)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}