"use client";

import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.bubble.css";

// Thin wrapper so that Next.js dynamic() resolves the chunk path correctly
const QuillEditor = ({ value, onChange, placeholder, className, editorRef }) => {
  return (
    <ReactQuill
      ref={editorRef}
      className={className}
      theme="bubble"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
};

export default QuillEditor;
