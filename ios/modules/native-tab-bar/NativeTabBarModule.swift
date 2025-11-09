import ExpoModulesCore
import UIKit

// MARK: - Native Tab Bar Module
public class NativeTabBarModule: Module {
    public func definition() -> ModuleDefinition {
        Name("NativeTabBar")
        
        // View component for the native tab bar
        View(NativeTabBarView.self) {
            Prop("items") { (view: NativeTabBarView, items: [[String: Any]]) in
                view.configureItems(items)
            }
            
            Prop("selectedIndex") { (view: NativeTabBarView, index: Int) in
                view.setSelectedIndex(index)
            }
            
            Prop("blurIntensity") { (view: NativeTabBarView, intensity: Double) in
                view.setBlurIntensity(intensity)
            }
            
            Events("onTabSelected")
        }
    }
}

// MARK: - Event Emitter Protocol
protocol NativeTabBarViewDelegate: AnyObject {
    func tabBarDidSelectItem(at index: Int, title: String, icon: String?)
}

// MARK: - Native Tab Bar View
public class NativeTabBarView: ExpoView {
    private var tabBar: UITabBar!
    private var blurEffectView: UIVisualEffectView!
    private var items: [UITabBarItem] = []
    private var onTabSelectedEvent: EventDispatcher?
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        setupTabBar()
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    private func setupTabBar() {
        // Create UITabBar with native iOS styling
        tabBar = UITabBar()
        tabBar.translatesAutoresizingMaskIntoConstraints = false
        tabBar.barTintColor = .clear
        tabBar.isTranslucent = true
        tabBar.backgroundColor = .clear
        
        // Configure appearance following Apple's HIG
        let appearance = UITabBarAppearance()
        appearance.configureWithTransparentBackground()
        appearance.backgroundColor = .clear
        
        // Use system blur material for glass effect
        let blurEffect = UIBlurEffect(style: .systemUltraThinMaterialDark)
        blurEffectView = UIVisualEffectView(effect: blurEffect)
        blurEffectView.translatesAutoresizingMaskIntoConstraints = false
        blurEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        
        // Configure tab bar item appearance
        appearance.stackedLayoutAppearance.normal.iconColor = UIColor.white.withAlphaComponent(0.65)
        appearance.stackedLayoutAppearance.normal.titleTextAttributes = [
            .foregroundColor: UIColor.white.withAlphaComponent(0.65),
            .font: UIFont.systemFont(ofSize: 11, weight: .medium)
        ]
        
        appearance.stackedLayoutAppearance.selected.iconColor = UIColor(red: 1.0, green: 0.717, blue: 0.012, alpha: 1.0) // #FFB703
        appearance.stackedLayoutAppearance.selected.titleTextAttributes = [
            .foregroundColor: UIColor(red: 1.0, green: 0.717, blue: 0.012, alpha: 1.0),
            .font: UIFont.systemFont(ofSize: 11, weight: .semibold)
        ]
        
        tabBar.standardAppearance = appearance
        tabBar.scrollEdgeAppearance = appearance
        
        // Add blur view as background
        addSubview(blurEffectView)
        addSubview(tabBar)
        
        tabBar.delegate = self
        
        // Constraints
        NSLayoutConstraint.activate([
            blurEffectView.topAnchor.constraint(equalTo: topAnchor),
            blurEffectView.leadingAnchor.constraint(equalTo: leadingAnchor),
            blurEffectView.trailingAnchor.constraint(equalTo: trailingAnchor),
            blurEffectView.bottomAnchor.constraint(equalTo: bottomAnchor),
            
            tabBar.topAnchor.constraint(equalTo: topAnchor),
            tabBar.leadingAnchor.constraint(equalTo: leadingAnchor),
            tabBar.trailingAnchor.constraint(equalTo: trailingAnchor),
            tabBar.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])
    }
    
    func configureItems(_ itemsData: [[String: Any]]) {
        var tabBarItems: [UITabBarItem] = []
        
        for (index, itemData) in itemsData.enumerated() {
            let title = itemData["title"] as? String ?? ""
            let iconName = itemData["icon"] as? String ?? ""
            
            // Create system icon or custom
            let image = UIImage(systemName: iconName) ?? UIImage(systemName: "circle")
            let selectedImage = UIImage(systemName: iconName + ".fill") ?? image
            
            let tabBarItem = UITabBarItem(title: title, image: image, selectedImage: selectedImage)
            tabBarItem.tag = index
            tabBarItems.append(tabBarItem)
        }
        
        items = tabBarItems
        tabBar.items = tabBarItems
    }
    
    func setSelectedIndex(_ index: Int) {
        guard index >= 0 && index < items.count else { return }
        tabBar.selectedItem = items[index]
    }
    
    func setBlurIntensity(_ intensity: Double) {
        // Adjust blur intensity (0-100)
        let alpha = CGFloat(intensity / 100.0)
        
        // Update blur effect based on intensity
        if intensity > 80 {
            blurEffectView.effect = UIBlurEffect(style: .systemUltraThinMaterialDark)
        } else if intensity > 50 {
            blurEffectView.effect = UIBlurEffect(style: .systemThinMaterialDark)
        } else {
            blurEffectView.effect = UIBlurEffect(style: .systemMaterialDark)
        }
        
        blurEffectView.alpha = alpha
    }
    
    override func installEventDispatcher(_ eventDispatcher: EventDispatcher) {
        self.onTabSelectedEvent = eventDispatcher
    }
}

// MARK: - UITabBarDelegate
extension NativeTabBarView: UITabBarDelegate {
    public func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
        let index = item.tag
        guard index < items.count else { return }
        
        // Trigger haptic feedback
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()
        
        // Send event to React Native
        onTabSelectedEvent?([
            "index": index,
            "title": item.title ?? "",
            "icon": ""
        ])
    }
}

