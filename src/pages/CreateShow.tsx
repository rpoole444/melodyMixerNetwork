'use client';
import Header from '@/components/Header';
import { useState, useRef, useEffect } from 'react';
import { useEdgeStore } from '@/lib/edgestore';

interface Track {
  title: string;
  artist: string;
  length: string;
  details?: string;
  fileUrl?: string;
}

export default function CreateShow() {
  const { edgestore } = useEdgeStore();
  
  const [tracks, setTracks] = useState<Track[]>([]);
  const [trackTitle, setTrackTitle] = useState('');
  const [trackArtist, setTrackArtist] = useState('');
  const [trackLength, setTrackLength] = useState('');
  const [trackDetails, setTrackDetails] = useState('');
  
  const [showTitle, setShowTitle] = useState('');
  const [showDescription, setShowDescription] = useState('');
  
  const [trackFile, setTrackFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedAudioURL, setRecordedAudioURL] = useState<string | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // Initialize media recorder
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setRecordedAudioURL(url);
    }
  }, [audioBlob]);

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      setTrackFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileChange(files);
  };

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);
        recorder.start();
        setIsRecording(true);

        recorder.ondataavailable = (event) => {
          audioChunks.current.push(event.data);
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
          setAudioBlob(audioBlob);
          audioChunks.current = [];
        };
      });
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };


  const addTrack = async () => {
    if (trackFile || audioBlob) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        let fileUrl = '';
        if (trackFile) {
          const response = await edgestore.publicFiles.upload({
            file: trackFile,
            onProgressChange: (progress) => {
              setUploadProgress(progress);
            },
          });
          fileUrl = response.url;
        } else if (audioBlob) {
          const file = new File([audioBlob], `${trackTitle}.wav`, { type: 'audio/wav' });
          const response = await edgestore.publicFiles.upload({
            file,
            onProgressChange: (progress) => {
              setUploadProgress(progress);
            },
          });
          fileUrl = response.url;
        }

        const newTrack = {
          title: trackTitle,
          artist: trackArtist,
          length: trackLength,
          details: trackDetails,
          fileUrl,
        };

        setTracks([...tracks, newTrack]);
        setTrackTitle('');
        setTrackArtist('');
        setTrackLength('');
        setTrackDetails('');
        setTrackFile(null);
        setAudioBlob(null);
        setRecordedAudioURL(null);
      } catch (error) {
        console.error('Error uploading track:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const saveShow = () => {
    const showData = {
      host: "KC & JOE JOE",
      title: showTitle,
      description: showDescription,
      tracks
    };
    console.log('Saving show:', showData);
  };

  return (
    <div className="p-8 bg-black h-full">
      <Header title="Melody Mixer Network" />
      <div className='flex justify-center flex-col items-center'>
        <h1 className="text-2xl font-bold mb-4 text-white mt-10">Create a New Show</h1>
        <div className="mt-8 w-full flex justify-center flex-col items-center">
          <h2 className="text-xl font-bold mb-4">Add Track</h2>
          <input
            name='Track Title'
            type="text"
            value={trackTitle}
            onChange={(e) => setTrackTitle(e.target.value)}
            placeholder="Track Title"
            className="shadow border rounded w-2/3 py-2 px-3 text-gray-700 mb-4"
          />
          <input
            name='Track Artist'
            type="text"
            value={trackArtist}
            onChange={(e) => setTrackArtist(e.target.value)}
            placeholder="Artist"
            className="shadow border rounded w-2/3 py-2 px-3 text-gray-700 mb-4"
          />
          <input
            name='Track Length'
            type="text"
            value={trackLength}
            onChange={(e) => setTrackLength(e.target.value)}
            placeholder="Track Length"
            className="shadow border rounded w-2/3 py-2 px-3 text-gray-700 mb-4"
          />
          <textarea
            name='Track Details'
            value={trackDetails}
            onChange={(e) => setTrackDetails(e.target.value)}
            placeholder="Track Details (optional)"
            className="shadow border rounded w-2/3 py-2 px-3 text-gray-700 mb-4"
            rows={2}
          />
          <div
            className="shadow border bg-neutral-700 rounded w-2/3 py-8 px-3 text-gray-700 mb-4 flex items-center justify-center bg-gray-200"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e.target.files)}
              className="hidden"
            />
            <button
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="bg-blue-500 hover:bg-blue-700 text-l font-bold py-2 px-4 rounded"
            >
              {trackFile ? trackFile.name : 'Drag & Drop or Click to Upload Track'}
            </button>
          </div>
          <div className="mt-4 flex flex-col items-center">
            {recordedAudioURL && (
              <div className="mt-4">
                <audio controls src={recordedAudioURL}></audio>
              </div>
            )}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`ml-6 mt-5 mb-5 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ${
                isRecording ? 'bg-green-500 hover:bg-green-700' : 'bg-red-500'
              }`}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
          </div>
          <button
            onClick={addTrack}
            disabled={!trackFile && !audioBlob || isUploading}
            className={`ml-6 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${
              (!trackFile && !audioBlob) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isUploading ? 'Uploading...' : 'Add Track'}
          </button>
          {isUploading && (
            <div className="w-2/3 bg-gray-200 rounded mt-4">
              <div
                className="bg-blue-500 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded"
                style={{ width: `${uploadProgress}%` }}
              >
                {uploadProgress}%
              </div>
            </div>
          )}
        </div>
        <div className="mt-8">
          <h3 className="text-lg font-bold h-full">Current Tracks</h3>
          {tracks.map((track, index) => (
            <div key={index} className="mt-2 text-white p-2 border rounded">
              <p><strong>Title:</strong> {track.title}</p>
              <p><strong>Artist:</strong> {track.artist}</p>
              <p><strong>Length:</strong> {track.length}</p>
              <p className='p-5'><strong>Track:</strong> 
              <audio controls>
                <source src={track.fileUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
              </p>
              {track.details && <p><strong>Details:</strong> {track.details}</p>}
            </div>
          ))}
        </div>
        <label className="block text-sm font-bold mb-2" htmlFor="hostname">Host Name</label>
        <input
          type="text"
          value="Hardcoded Hostname"
          id="hostname"
          className="shadow border rounded w-2/3 py-2 px-3 text-gray-700 mb-4"
          disabled
        />
        <label className="block text-sm font-bold mb-2" htmlFor="showTitle">Show Title</label>
        <input
          type="text"
          value={showTitle}
          onChange={(e) => setShowTitle(e.target.value)}
          id="showTitle"
          className="shadow border rounded w-2/3 py-2 px-3 text-gray-700 mb-4"
        />
        <label className="block text-sm font-bold mb-2" htmlFor="showDescription">Show Description</label>
        <textarea
          value={showDescription}
          onChange={(e) => setShowDescription(e.target.value)}
          id="showDescription"
          className="shadow border rounded w-2/3 py-2 px-3 text-gray-700 mb-4"
          rows={3}
        />
        <button onClick={saveShow} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Save Show
        </button>
      </div>
    </div>
  );
}
