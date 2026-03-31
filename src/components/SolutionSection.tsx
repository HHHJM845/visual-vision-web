const SolutionSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          告别传统视频外包，迎接全新的AIGC解决办法。
        </h2>
        <p className="text-sm text-muted-foreground mb-12">
          流畅的承制体验，AI影制全面保证您的交易安全与质量
        </p>

        {/* Laptop mockup */}
        <div className="relative max-w-2xl mx-auto mb-16">
          <div className="bg-muted rounded-xl border-2 border-border p-3 shadow-xl">
            <div className="bg-card rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&h=500&fit=crop"
                alt="平台展示"
                className="w-full h-full object-cover rounded"
              />
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -bottom-4 -left-8 w-16 h-16 bg-primary/10 rounded-full" />
          <div className="absolute -bottom-4 -right-8 w-16 h-16 bg-primary/10 rounded-full" />
          <div className="absolute -top-4 left-1/4 w-8 h-8 bg-secondary/20 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
