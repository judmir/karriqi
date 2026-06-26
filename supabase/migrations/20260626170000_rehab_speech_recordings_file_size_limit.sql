-- Allow long speech sessions (e.g. extended rehab recordings) up to 500 MB.
update storage.buckets
set file_size_limit = 524288000
where id = 'rehab-speech-recordings';
