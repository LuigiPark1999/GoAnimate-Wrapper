const loadPost = require("../misc/post_body");
const header = process.env.XML_HEADER;
const fUtil = require("../misc/file");
const nodezip = require("node-zip");
const base = Buffer.alloc(1, 0);
const asset = require("./main");
const http = require("http");

async function listAssets(data, makeZip) {
	var xmlString;
	switch (data.type) {
		case "char": {
			const chars = await asset.chars(data.themeId);
			xmlString = `${header}<ugc more="0">${chars
				.map(
					(v) =>
						`<char id="${v.id}" name="Untitled" cc_theme_id="${v.theme}" thumbnail_url="http://localhost/char_thumbs/${v.id}.png" copyable="Y"><tags/></char>`
				)
				.join("")}</ugc>`;
			break;
		}
		case "bg": {
			var files = asset.list(data.movieId, "bg");
			xmlString = `${header}<ugc more="0">${files
				.map((v) => `<background subtype="0" id="${v.id}" name="${v.name}" enable="Y"/>`)
				.join("")}</ugc>`;
			break;
		}
		case "bgmusic": {
			var files = asset.list(data.movieId, "bgmusic");
			xmlString = `${header}<ugc more="0">${files
				.map(
					(v) =>
						`<sound subtype="bgmusic" id="${v.id}" name="${v.name}" enable="Y" duration="${v.duration}" downloadtype="progressive" enc_asset_id="${v.id}" signature="${v.signature}"/>`
				)
				.join("")}</ugc>`;
			break;
		}
		case "soundeffect": {
			var files = asset.list(data.movieId, "soundeffect");
			xmlString = `${header}<ugc more="0">${files
				.map(
					(v) =>
						`<sound subtype="soundeffect" id="${v.id}" name="${v.name}" enable="Y" duration="${v.duration}" downloadtype="progressive" enc_asset_id="${v.id}" signature="${v.signature}"/>`
				)
				.join("")}</ugc>`;
			break;
		}
		case "sound":
		case "voiceover": {
			var files = asset.list(data.movieId, "voiceover");
			xmlString = `${header}<ugc more="0">${files
				.map(
					(v) =>
						`<sound subtype="voiceover" id="${v.id}" name="${v.name}" enable="Y" duration="${v.duration}" downloadtype="progressive" enc_asset_id="${v.id}" signature="${v.signature}"/>`
				)
				.join("")}</ugc>`;
			break;
		}
		case "movie": {
			xmlString = `${header}<ugc more="0"><movie id="0E1kFIezEQqI" enc_asset_id="0dVt8Bp8NAeCybOqn9az0aQ" path="movie/307569887.jpg" numScene="1" title="full" thumbnail_url="https://assets.goanimate.com/v1/get/fs.goanimate.com/files/asset/2680/11498680/307569887.jpg?enc_type=sse_c&amp;expires=1494931554&amp;sec_key_id=1241596&amp;signature=b7e6e6a2f4bccf634e797cf17564e72746343c62ae4a36102569b8333c256061"><tags></tags></movie></ugc>`;
			break;
		}
		case "prop":
		default: {
			var files = asset.list(data.movieId, "prop");
			xmlString = `${header}<ugc more="0">${files
				.map(
					(v) =>
						`<prop subtype="0" id="${v.id}" name="${v.name}" enable="Y" holdable="0" headable="0" placeable="1" facing="left" width="0" height="0" duration="0" enc_asset_id="${v.id}"/>`
				)
				.join("")}</ugc>`;
			break;
		}
	}

	if (makeZip) {
		const zip = nodezip.create();
		const files = asset.listAll(data.movieId);
		fUtil.addToZip(zip, "desc.xml", Buffer.from(xmlString));

		files.forEach((file) => {
			switch (file.mode) {
				case "bg": {
					const buffer = asset.load(data.movieId, file.id);
					fUtil.addToZip(zip, `${file.mode}/${file.id}`, buffer);
					break;
				}
				case "sound":
				case "soundeffect": {
					const buffer = asset.load(data.movieId, file.id);
					fUtil.addToZip(zip, `${file.mode}/${file.id}`, buffer);
					break;
				}
				case "bgmusic": {
					const buffer = asset.load(data.movieId, file.id);
					fUtil.addToZip(zip, `${file.mode}/${file.id}`, buffer);
					break;
				}
				case "voiceover": {
					const buffer = asset.load(data.movieId, file.id);
					fUtil.addToZip(zip, `${file.mode}/${file.id}`, buffer);
					break;
				}
				case "effect":
				case "prop": {
					const buffer = asset.load(data.movieId, file.id);
					fUtil.addToZip(zip, `${file.mode}/${file.id}`, buffer);
					break;
				}
			}
		});
		return await zip.zip();
	} else {
		return Buffer.from(xmlString);
	}
}

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
	var makeZip = false;
	switch (url.pathname) {
		case "/goapi/getUserAssets/":
			makeZip = true;
			break;
		case "/goapi/getUserAssetsXml/":
			break;
		default:
			return;
	}

	switch (req.method) {
		case "GET": {
			var q = url.query;
			if (q.movieId && q.type) {
				listAssets(q, makeZip).then((buff) => {
					const type = makeZip ? "application/zip" : "text/xml";
					res.setHeader("Content-Type", type);
					res.end(buff);
				});
				return true;
			} else return;
		}
		case "POST": {
			loadPost(req, res)
				.then(([data]) => listAssets(data, makeZip))
				.then((buff) => {
					const type = makeZip ? "application/zip" : "text/xml";
					res.setHeader("Content-Type", type);
					if (makeZip) res.write(base);
					res.end(buff);
				});
			return true;
		}
		default:
			return;
	}
};
