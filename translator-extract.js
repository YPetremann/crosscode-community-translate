const path = require('path')
const fs = require('fs')

function walkSync(dir) {
	if(fs.statSync(dir).isDirectory()) {
		var files = fs.readdirSync(dir)
		    files = files.map(file => walkSync(path.join(dir, file)))
		return [].concat(...files)
	} else {
		return [dir]
	}
}

var content = {}
var ret = {}
function scan(obj, path, file, stc= false) {
	if (stc && (typeof(obj) == "string")){
		var lang = file.split(".").slice(-2)[0]
		ret[lang] = ret[lang] || {}
		ret[lang][path] = obj
	} else if (obj instanceof Object) {
		if(stc || (obj.hasOwnProperty("DOCTYPE") && obj["DOCTYPE"]=="STATIC-LANG-FILE")) {
			stc = true
			for (var k in obj) {
				if (obj.hasOwnProperty(k)) {
					stc = scan( obj[k], path?`${path}.${k}`:k, file, true) || stc
				}
			}
		} else if (obj.hasOwnProperty("langUid")) {
			for (var lang in obj) {
				if (lang != "langUid") {
					ret[lang] = ret[lang] || {}
					ret[lang][path] = obj[lang]
				}
			}
		} else for (var k in obj) {
			if (obj.hasOwnProperty(k)) {
				stc = scan( obj[k], path?`${path}.${k}`:k, file) || stc
			}
		}
	}
	return stc
}
var l = walkSync(".\\assets")
for(i in l){
	try{
		var file = l[i]
		var json = JSON.parse(fs.readFileSync(file, 'utf8'));
		console.log(`${i}/${l.length} Successfully loaded : ${file}`)
		ret = {}
		var stc = scan(json, null, file)
		if(stc){
			fileC = file.split(".")
			file = [...fileC.slice(0,-2),"${LANG}",...fileC.slice(-1)].join(".")
		}
		for(lang in ret) {
			content[lang] = content[lang] || {}
			content[lang][file.split("\\").join("/")] = ret[lang]
		}
	} catch(e) {
		if (e instanceof SyntaxError) {
			console.error(`${i}/${l.length} Syntax Error in File : ${l[i]}`);
		}else{
			console.error(e);
		}
	}
}
for(lang in content) {
	raw = JSON.stringify(content[lang], null, 2)
	fs.writeFileSync(path.join(`langs`,`${lang}.lang.json`), raw)
	console.log(`Written langs/${lang}.lang.json ${raw.length}B`)
}
