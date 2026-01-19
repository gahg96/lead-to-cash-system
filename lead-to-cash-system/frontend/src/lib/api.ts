const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

const getHeaders = (isMultipart = false) => {
    const headers: any = {};
    if (!isMultipart) {
        headers["Content-Type"] = "application/json";
    }
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }
    return headers;
};

const handleResponse = async (res: Response) => {
    if (res.status === 401) {
        if (typeof window !== "undefined" && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
        throw new Error("Unauthorized");
    }
    if (!res.ok) {
        let errorMessage = res.statusText;
        try {
            const errorData = await res.json();
            errorMessage = errorData.message || JSON.stringify(errorData);
        } catch (e) {
            errorMessage = await res.text();
        }
        console.error(`API Error:`, res.status, errorMessage);
        throw new Error(errorMessage);
    }
    return res.json();
};

export const api = {
    get: async (endpoint: string) => {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: getHeaders(),
        });
        return handleResponse(res);
    },
    post: async (endpoint: string, data: any) => {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    patch: async (endpoint: string, data: any) => {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    upload: async (endpoint: string, formData: FormData) => {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "POST",
            headers: getHeaders(true),
            body: formData,
        });
        return handleResponse(res);
    },
    uploadWithProgress: (
        endpoint: string,
        formData: FormData,
        onProgress: (progress: number) => void
    ): Promise<any> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${API_BASE_URL}${endpoint}`);

            const headers = getHeaders(true);
            Object.keys(headers).forEach(key => {
                xhr.setRequestHeader(key, headers[key]);
            });

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    onProgress(percentComplete);
                }
            };

            xhr.onload = async () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        resolve(xhr.responseText);
                    }
                } else {
                    let errorMessage = xhr.statusText;
                    try {
                        const errorData = JSON.parse(xhr.responseText);
                        errorMessage = errorData.message || JSON.stringify(errorData);
                    } catch (e) {
                        // ignore
                    }
                    if (xhr.status === 401) {
                        if (typeof window !== "undefined" && !window.location.pathname.includes('/login')) {
                            window.location.href = '/login';
                        }
                    }
                    reject(new Error(errorMessage));
                }
            };

            xhr.onerror = () => {
                reject(new Error("Network Error"));
            };

            xhr.send(formData);
        });
    },
    delete: async (endpoint: string) => {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "DELETE",
            headers: getHeaders(),
        });
        return handleResponse(res);
    }
};
