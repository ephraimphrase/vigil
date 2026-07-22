import sys
from html.parser import HTMLParser

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.hide = False

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'svg', 'nav', 'header', 'footer'):
            self.hide = True

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'svg', 'nav', 'header', 'footer'):
            self.hide = False

    def handle_data(self, data):
        if not self.hide:
            cleaned = data.strip()
            if cleaned:
                self.text.append(cleaned)

def extract(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            # The content has a header added by the system, find the HTML part
            html_start = content.find('<!DOCTYPE html>')
            if html_start != -1:
                content = content[html_start:]
                
        extractor = TextExtractor()
        extractor.feed(content)
        return "\n".join(extractor.text)
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    file1 = r"C:\Users\ephra\.gemini\antigravity\brain\68b6df97-1cdf-4830-8f70-5ce33b252b76\.system_generated\steps\209\content.md"
    file2 = r"C:\Users\ephra\.gemini\antigravity\brain\68b6df97-1cdf-4830-8f70-5ce33b252b76\.system_generated\steps\210\content.md"
    
    print("--- MCP SERVER DOCS ---")
    print(extract(file1))
    print("\n--- AGENTIC WALLET DOCS ---")
    print(extract(file2))
