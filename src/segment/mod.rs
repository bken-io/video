use std::fs;
use std::env;
use std::process::Command;

mod presets;
mod dimensions;

// TODO :: Make util
fn mkdirp(path: String) -> std::io::Result<()> {
    println!("Creating directory {}", path);
    fs::create_dir_all(path)?;
    Ok(())
}

pub fn run(args: clap::ArgMatches) {
    let current_dir = env::current_dir().unwrap();
    println!("Current path: {}", current_dir.display());
    println!("Segmentation module invoked, {:?}", args);

    // TODO :: read from cli args
    let tmp_dir = format!("{}/tmp", current_dir.display());
    let path = format!("{}/test.mp4", tmp_dir);
    let segment_path = format!("{}/segments", tmp_dir);

    let _mk_dir_out = mkdirp(segment_path.clone());

    // TODO :: move to helper fn
    println!("Segmenting video with ffmpeg");
    let _ffmpeg_seg = Command::new("ffmpeg")
        .arg("-y")
        .arg("-i")
        .arg(path.clone())
        .arg("-c")
        .arg("copy")
        .arg("-f")
        .arg("segment")
        .arg("-segment_time")
        .arg("1")
        .arg("-an")
        .arg(format!("{}/{}", segment_path.clone(), "output_%04d.mp4"))
        .output();

    // TODO :: move to helper fn
    println!("Separating audio");
    let _ffmpeg_audio = Command::new("ffmpeg")
        .arg("-y")
        .arg("-i")
        .arg(path.clone())
        .arg("./tmp/test.wav")
        .output();

    let dimensions = dimensions::get_dimensions(path.clone());
    let presets = presets::presets(dimensions[0]);

    // TODO :: create_thumbnail

    let paths = fs::read_dir(segment_path).unwrap();

    // TODO :: Performance Improvements
    // Could combine items into a vector
    // for 10 items in the vector, make an sqs batch reuqest
    // Then invoke all requests async
    for s in 0..paths.count() {
        for p in &presets {
            println!("enqueueing segment: {} for preset {}", s, p)
            // send sqs message
        }
    }

    // TODO :: add concatination job to sqs queue
}
